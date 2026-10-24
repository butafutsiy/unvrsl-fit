'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.UNVRSLLoadAdjustment = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const VERSION = 2;
  const n = value => {
    if (value == null || typeof value === 'boolean' || String(value).trim() === '') return null;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round = x => Number(x.toFixed(6));
  const fmt = x => Number(x).toLocaleString('ru-RU', {maximumFractionDigits: 2});
  function category(input) {
    const type = String(input.loadType || 'external_total');
    const kind = String(input.exerciseKind || '').toLowerCase();
    const name = String(input.exerciseName || '').toLowerCase();
    const isolated = kind === 'isolation' || /мах[ио]|разведени|разгибани|сгибани|подъ[её]м.*бицепс|подъем.*бицепс|подъ[её]м.*дельт|fly|curl|extension|raise|lateral/i.test(name);
    if (type === 'per_dumbbell') return isolated ? 'small_dumbbell' : 'dumbbell';
    if (isolated) return 'isolation';
    if (/жим ногами|leg press|гакк|хакк|hack squat|рычажн/i.test(name)) return 'large_machine';
    if (['machine_stack', 'per_side'].includes(type)) return 'machine';
    if (['bodyweight_added', 'bodyweight_assisted'].includes(type)) return 'bodyweight';
    if (/становая|deadlift|присед|squat/i.test(name)) return 'heavy_compound';
    return 'compound';
  }
  const CAPS = {
    compound: {up: .05, down: .10},
    heavy_compound: {up: .04, down: .09},
    machine: {up: .06, down: .12},
    large_machine: {up: .06, down: .12},
    isolation: {up: .055, down: .10},
    dumbbell: {up: .08, down: .12},
    small_dumbbell: {up: .08, down: .12},
    bodyweight: {up: .06, down: .10},
  };
  function effective(external, loadType, bodyWeight, sides, base) {
    if (loadType === 'per_side') return external * sides + base;
    if (loadType === 'bodyweight_assisted') return bodyWeight - external;
    if (loadType === 'bodyweight_added') return bodyWeight + external;
    return external;
  }
  function candidates(input, current, min) {
    const available = (Array.isArray(input.available) ? input.available : []).map(n).filter(x => x != null && x >= min).sort((a, b) => a - b);
    if (available.length) return [...new Set(available)];
    const step = n(input.step);
    if (!(step > 0)) return [current];
    const index = Math.round((current - min) / step);
    const values = [current];
    for (let offset = -12; offset <= 12; offset++) {
      const candidate = round(min + (index + offset) * step);
      if (candidate >= min) values.push(candidate);
    }
    return [...new Set(values)].sort((a, b) => a - b);
  }
  function result(action, weight, reason, extra = {}) {
    return {action, weight, reason, ...extra, version: VERSION};
  }
  function adjust(input = {}) {
    const loadType = input.loadType || 'external_total';
    const weight = n(input.weight), reps = n(input.actualReps);
    const rawRir = n(input.actualRir);
    const rpe = n(input.actualRpe);
    const rir = rawRir != null ? rawRir : rpe != null && rpe >= 1 && rpe <= 10 ? 10 - rpe : null;
    const lowReps = n(input.targetRepMin), highReps = n(input.targetRepMax) ?? lowReps;
    const lowRir = n(input.targetRirMin), highRir = n(input.targetRirMax) ?? lowRir;
    const minimal = n(input.min) ?? 0;
    const bodyWeight = n(input.bodyWeight);
    const sides = n(input.loadedSides), base = n(input.implementWeight);
    const group = category(input), caps = CAPS[group];
    const general = {category:group, actualRir:rir, targetRir: lowRir != null ? [lowRir, highRir] : null};
    if (input.pain === true) return result('stop', weight, 'Отмечена боль: останови упражнение и проверь причину', {...general, confidence:'none'});
    if (weight == null || weight < 0 || !Number.isInteger(reps) || reps < 0 || reps > 30 || lowReps == null || lowReps < 1 || !Number.isInteger(lowReps) || !Number.isInteger(highReps) || highReps < lowReps || lowRir == null || lowRir < 0 || minimal < 0 || highRir < lowRir || highRir > 9)
      return result('hold', weight, 'Нет полных данных для расчёта нагрузки', {...general, confidence:'none'});
    if (input.techniqueFailed === true || input.fullROM === false || input.partial === true || input.incomplete === true)
      return result('hold', weight, 'Нарушена техника или амплитуда: нагрузку не повышать, проверить выполнение', {...general, confidence:'low'});
    if (input.warmup === true) return result('hold', weight, 'Разминочный подход не меняет рабочую нагрузку', {...general, confidence:'none'});
    if (['time','distance','repetitions_only','bodyweight_only'].includes(loadType))
      return result('hold', weight, 'Для этого упражнения нужна прогрессия по повторам, времени или сложности', {...general, confidence:'none'});
    if (rir == null || rir < 0 || rir > 9 || input.effortUncertain || input.effortCensored || rir >= 6)
      return result('hold', weight, 'RIR не определён или оценка слишком приблизительная: вес сохранён', {...general, confidence:'low'});
    if (reps > 20 || highReps > 20) return result('hold', weight, 'Высокоповторный подход: без прогноза веса по формуле 1ПМ', {...general, confidence:'low'});
    if (['bodyweight_assisted','bodyweight_added'].includes(loadType) && !(bodyWeight > 0))
      return result('hold', weight, 'Для этого упражнения нужна актуальная масса тела', {...general, confidence:'none'});
    if (loadType === 'per_side' && (!(sides > 0) || !Number.isInteger(sides) || base == null || base < 0))
      return result('hold', weight, 'Укажи число загруженных сторон и массу каретки или рычага', {...general, confidence:'none'});
    const currentEffective = effective(weight, loadType, bodyWeight, sides, base);
    if (!(currentEffective > 0)) return result('hold', weight, 'Недостаточная эффективная нагрузка для расчёта', {...general, confidence:'none'});
    const actualCapacity = reps + rir;
    const lowerCapacity = lowReps + lowRir;
    const upperCapacity = highReps + highRir;
    const shortage = Math.max(0, lowerCapacity - actualCapacity);
    const excess = Math.max(0, actualCapacity - upperCapacity);
    const evidence = {actualCapacity, capacityRange:[lowerCapacity, upperCapacity], shortage, excess};
    if (reps < lowReps && rir > highRir)
      return result('hold', weight, 'Повторы не добраны, но запас сохранён: сначала выполни заданные повторения', {...general, ...evidence, confidence:'medium'});
    if (shortage < 2 && excess < 2)
      return result('hold', weight, 'Небольшое отклонение от цели: сохранить вес и уточнить результат следующим подходом', {...general, ...evidence, confidence:'medium'});
    if (excess >= 2 && reps < lowReps)
      return result('hold', weight, 'Сначала добери минимальное число повторений, затем оцени повышение', {...general, ...evidence, confidence:'medium'});
    const harder = excess >= 2;
    if (harder && input.deload === true)
      return result('hold', weight, 'Плановая разгрузка: сохранить заданную лёгкую нагрузку', {...general, ...evidence, confidence:'medium'});
    const inverse = loadType === 'bodyweight_assisted';
    const strengthGap = harder ? excess : shortage;
    const capacityReference = 30 + (lowerCapacity + upperCapacity) / 2;
    const damping = harder ? .60 : strengthGap >= 3 ? .76 : .66;
    const fraction = Math.min(harder ? (rir >= 5 ? Math.min(caps.up, .03) : caps.up) : caps.down, strengthGap / capacityReference * damping);
    const wantedEffective = currentEffective * (harder ? 1 + fraction : 1 - fraction);
    const wanted = loadType === 'per_side' ? (wantedEffective - base) / sides : inverse ? bodyWeight - wantedEffective : loadType === 'bodyweight_added' ? wantedEffective - bodyWeight : wantedEffective;
    const sign = (harder ? 1 : -1) * (inverse ? -1 : 1);
    const legal = candidates(input, weight, minimal).filter(candidate => {
      const difference = candidate - weight;
      if (difference * sign <= 1e-8) return false;
      const nextEffective = effective(candidate, loadType, bodyWeight, sides, base);
      const pct = Math.abs(nextEffective / currentEffective - 1);
      return nextEffective > 0 && pct <= (harder ? (rir >= 5 ? Math.min(caps.up, .03) : caps.up) : caps.down) + 1e-8;
    });
    if (!legal.length)
      return result('hold', weight, 'Ближайший доступный шаг оборудования слишком большой: сохрани вес или используй микронагрузку', {...general, ...evidence, confidence:'medium', desired:round(wanted), blockedByStep:true});
    const chosen = legal.reduce((best, candidate) => {
      const distance = Math.abs(candidate-wanted), bestDistance = Math.abs(best-wanted);
      return distance < bestDistance - 1e-8 || (Math.abs(distance-bestDistance) < 1e-8 && Math.abs(candidate-weight)<Math.abs(best-weight)) ? candidate : best;
    });
    const desiredDelta = Math.abs(wanted-weight);
    if (desiredDelta < Math.abs(chosen-weight)*.5)
      return result('hold', weight, 'Расчётное изменение меньше половины минимального шага оборудования', {...general, ...evidence, confidence:'medium', desired:round(wanted)});
    const magnitude = Math.abs(chosen-weight), effortAction = harder ? 'up' : 'down';
    const visibleDirection = inverse ? (harder ? 'уменьшить помощь' : 'увеличить помощь') : (harder ? 'увеличить вес' : 'уменьшить вес');
    return result(effortAction, chosen,
      'Факт ' + reps + ' повт. с RIR ' + fmt(rir) + ', цель ' + lowReps + (highReps!==lowReps?'–'+highReps:'') + ' повт. с RIR ' + fmt(lowRir) + (highRir!==lowRir?'–'+fmt(highRir):'') + ': ' + visibleDirection + ' на ' + fmt(magnitude) + ' кг с учётом шага оборудования',
      {...general, ...evidence, confidence:rir >= 5 ? 'low' : 'medium', desired:round(wanted), percentChange:round((effective(chosen, loadType, bodyWeight, sides, base) / currentEffective - 1) * 100), step: n(input.step)});
  }
  return {adjust, category, version:VERSION};
});
