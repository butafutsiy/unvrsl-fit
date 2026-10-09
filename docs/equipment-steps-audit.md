# Аудит шагов веса: все 189 упражнений

Стандартные шаги являются настройками по умолчанию, а не паспортными характеристиками конкретного оборудования. Приоритет: доступные веса выбранного оборудования → его шаг → индивидуальная настройка упражнения → профиль каталога → резервный шаг по снаряду.

Шаг относится к числу, вводимому в подходе. Общий вес штанги: пара блинов по 0,25 кг увеличивает вес на 0,5 кг. Гантели: вес и шаг одной гантели. На сторону: вес и шаг одной стороны. Гравитрон: шаг помощи. Собственный вес и время: шаг в кг не применяется.

Пример: при среднем расчёте 135,5 кг шаг 0,5 сохраняет 135,5 кг; шаг 2,5 даёт 135 кг. При неравномерном ряду гантелей или гирь задаётся список реальных весов. Формулы 1ПМ, процентов и RPE/RIR не менялись.

Исправлены стандартные шаги гирь (4 кг), двух записей подтягиваний/брусьев с отягощением (2,5 кг), гравитрона (5 кг). Для упражнений без внешнего веса и времени убран фиктивный шаг 2,5 кг. Резервный шаг тренажёров больше не зависит от мышцы. Изменение профиля с тем же ID обновляет незавершённые подходы; выполненные подходы и история сохраняются.

Замечания к исходной базе, не изменённые этим исправлением: «Сгибание одной ноги стоя в тренажёре» (og:0795) описывает сгибание стоя без отягощения и имеет bodyweight_only; «Подъём коленей в висе» (og:0011) имеет исходный тип assisted/external_total. Их название, техника и тип нагрузки требуют отдельной проверки, а не угадывания шага.

| Снаряд | Тип нагрузки | Стандартный шаг, кг | Количество |
|---|---|---:|---:|
| body weight | bodyweight_only | 0 | 18 |
| barbell | external_total | 2.5 | 34 |
| body weight | time | 0 | 2 |
| smith machine | external_total | 2.5 | 19 |
| dumbbell | per_dumbbell | 2 | 36 |
| sled machine | external_total | 5 | 2 |
| weighted | external_total | 2.5 | 2 |
| kettlebell | external_total | 4 | 3 |
| leverage machine | machine_stack | 5 | 25 |
| cable | machine_stack | 5 | 29 |
| body weight | bodyweight_added | 2.5 | 7 |
| leverage machine | bodyweight_added | 2.5 | 2 |
| weighted | bodyweight_added | 2.5 | 3 |
| assisted | bodyweight_assisted | 5 | 1 |
| leverage machine | bodyweight_assisted | 5 | 1 |
| assisted | external_total | 2.5 | 1 |
| rope | time | 0 | 1 |
| ez barbell | external_total | 2.5 | 3 |

| ID | Упражнение | Снаряд | Тип нагрузки | Стандартный шаг, кг |
|---|---|---|---|---:|
| og:2466 | Альпинист | body weight | bodyweight_only | не применяется |
| og:0086 | Армейский жим сидя | barbell | external_total | 2.5 |
| canon:military_press | Армейский жим стоя | barbell | external_total | 2.5 |
| og:3636 | Бег с высоким подниманием коленей | body weight | time | не применяется |
| og:2368 | Болгарский сплит-присед | body weight | bodyweight_only | не применяется |
| og:0768 | Болгарский сплит-присед в Смите | smith machine | external_total | 2.5 |
| og:0410 | Болгарский сплит-присед с гантелями | dumbbell | per_dumbbell | 2 |
| og:0098 | Болгарский сплит-присед со штангой | barbell | external_total | 2.5 |
| og:3470 | Выпады вперёд | body weight | bodyweight_only | не применяется |
| og:0769 | Выпады вперёд в Смите | smith machine | external_total | 2.5 |
| og:1651 | Выпады вперёд с гантелями | dumbbell | per_dumbbell | 2 |
| og:1410 | Выпады вперёд со штангой | barbell | external_total | 2.5 |
| canon:reverse_lunge_db | Выпады назад с гантелями | dumbbell | per_dumbbell | 2 |
| og:3655 | Выпады ходьбой | body weight | bodyweight_only | не применяется |
| canon:hack_squat | Гакк-присед | sled machine | external_total | 5 |
| og:0489 | Гиперэкстензия | body weight | bodyweight_only | не применяется |
| canon:weighted_hyperextension | Гиперэкстензия с дополнительным весом | weighted | external_total | 2.5 |
| og:1760 | Гоблет-присед с гантелью | dumbbell | per_dumbbell | 2 |
| og:0534 | Гоблет-присед с гирей | kettlebell | external_total | 4 |
| og:1350 | Горизонтальная тяга в тренажёре | leverage machine | machine_stack | 5 |
| canon:one_arm_machine_row | Горизонтальная тяга в тренажёре одной рукой | leverage machine | machine_stack | 5 |
| og:0571 | Горизонтальная тяга в тренажёре узким хватом | leverage machine | machine_stack | 5 |
| canon:seated_cable_row | Горизонтальная тяга нижнего блока | cable | machine_stack | 5 |
| og:2137 | Жим Арнольда | dumbbell | per_dumbbell | 2 |
| og:0748 | Жим в Смите | smith machine | external_total | 2.5 |
| og:0757 | Жим в Смите на наклонной скамье | smith machine | external_total | 2.5 |
| og:0753 | Жим в Смите на отрицательной скамье | smith machine | external_total | 2.5 |
| og:1625 | Жим в Смите на отрицательной скамье узким хватом | smith machine | external_total | 2.5 |
| og:1309 | Жим в Смите на отрицательной скамье широким хватом | smith machine | external_total | 2.5 |
| og:0765 | Жим в Смите сидя на плечи | smith machine | external_total | 2.5 |
| og:0751 | Жим в Смите узким хватом | smith machine | external_total | 2.5 |
| og:1308 | Жим в Смите широким хватом | smith machine | external_total | 2.5 |
| canon:machine_chest_press | Жим в тренажёре на грудь | leverage machine | machine_stack | 5 |
| og:1299 | Жим в тренажёре на грудь на наклонной скамье | leverage machine | machine_stack | 5 |
| og:1300 | Жим в тренажёре на грудь на отрицательной скамье | leverage machine | machine_stack | 5 |
| canon:machine_shoulder_press | Жим в тренажёре на плечи | leverage machine | machine_stack | 5 |
| og:0289 | Жим гантелей лёжа | dumbbell | per_dumbbell | 2 |
| og:0352 | Жим гантелей лёжа нейтральным хватом | dumbbell | per_dumbbell | 2 |
| canon:incline_db_press | Жим гантелей на наклонной скамье | dumbbell | per_dumbbell | 2 |
| og:0301 | Жим гантелей на отрицательной скамье | dumbbell | per_dumbbell | 2 |
| canon:db_shoulder_press | Жим гантелей сидя | dumbbell | per_dumbbell | 2 |
| og:0414 | Жим гантелей стоя | dumbbell | per_dumbbell | 2 |
| og:2144 | Жим на грудь в кроссовере | cable | machine_stack | 5 |
| canon:leg_press | Жим ногами в тренажёре | sled machine | external_total | 5 |
| og:2611 | Жим ногами одной ногой | leverage machine | machine_stack | 5 |
| canon:bench_press | Жим штанги лёжа | barbell | external_total | 2.5 |
| og:0030 | Жим штанги лёжа узким хватом | barbell | external_total | 2.5 |
| og:0122 | Жим штанги лёжа широким хватом | barbell | external_total | 2.5 |
| og:0047 | Жим штанги на наклонной скамье | barbell | external_total | 2.5 |
| og:1257 | Жим штанги на наклонной скамье обратным хватом | barbell | external_total | 2.5 |
| og:1719 | Жим штанги на наклонной скамье узким хватом | barbell | external_total | 2.5 |
| og:0033 | Жим штанги на отрицательной скамье | barbell | external_total | 2.5 |
| og:1256 | Жим штанги на отрицательной скамье обратным хватом | barbell | external_total | 2.5 |
| og:0091 | Жим штанги сидя | barbell | external_total | 2.5 |
| canon:box_jump | Запрыгивания на тумбу | body weight | bodyweight_only | не применяется |
| canon:stepup_db | Зашагивания на платформу с гантелями | dumbbell | per_dumbbell | 2 |
| og:0114 | Зашагивания на платформу со штангой | barbell | external_total | 2.5 |
| og:0860 | Кикбэк в кроссовере | cable | machine_stack | 5 |
| og:3216 | Классические отжимания | body weight | bodyweight_added | 2.5 |
| og:0089 | Концентрированное сгибание на бицепс | barbell | external_total | 2.5 |
| og:0178 | Махи в стороны на блоке | cable | machine_stack | 5 |
| og:0584 | Махи в тренажёре на среднюю дельту | leverage machine | machine_stack | 5 |
| canon:lateral_raise | Махи гантелями в стороны | dumbbell | per_dumbbell | 2 |
| og:2317 | Махи гантелями в стороны сидя | dumbbell | per_dumbbell | 2 |
| canon:cable_rope_hammer | Молотковые сгибания на нижнем блоке с канатом | cable | machine_stack | 5 |
| canon:db_hammer_curl | Молотковые сгибания с гантелями | dumbbell | per_dumbbell | 2 |
| og:0602 | Обратная бабочка | leverage machine | machine_stack | 5 |
| og:0593 | Обратная гиперэкстензия | leverage machine | machine_stack | 5 |
| og:0192 | Отведение руки в сторону на блоке | cable | machine_stack | 5 |
| og:0009 | Отжимания на брусьях с акцентом на грудь | leverage machine | bodyweight_added | 2.5 |
| og:0490 | Отжимания от опоры | body weight | bodyweight_added | 2.5 |
| canon:weighted_dip | Отжимания на брусьях с дополнительным весом | weighted | bodyweight_added | 2.5 |
| canon:weighted_pushup | Отжимания с дополнительным весом | weighted | bodyweight_added | 2.5 |
| og:3211 | Отжимания с колен | body weight | bodyweight_added | 2.5 |
| og:0279 | Отжимания с ногами на возвышении | body weight | bodyweight_added | 2.5 |
| og:0283 | Отжимания узким хватом | body weight | bodyweight_added | 2.5 |
| og:1311 | Отжимания широким хватом | body weight | bodyweight_added | 2.5 |
| og:0464 | Планка | body weight | time | не применяется |
| canon:assisted_pullup | Подтягивания в гравитроне | assisted | bodyweight_assisted | 5 |
| og:0015 | Подтягивания в гравитроне узким хватом | leverage machine | bodyweight_assisted | 5 |
| og:1431 | Подтягивания обратным хватом | leverage machine | bodyweight_added | 2.5 |
| canon:weighted_pullup | Подтягивания с дополнительным весом | weighted | bodyweight_added | 2.5 |
| og:1429 | Подтягивания широким хватом | body weight | bodyweight_added | 2.5 |
| og:0310 | Подъём гантелей перед собой | dumbbell | per_dumbbell | 2 |
| og:0011 | Подъём коленей в висе | assisted | external_total | 2.5 |
| og:0001 | Подъём корпуса | body weight | bodyweight_only | не применяется |
| og:1393 | Подъём на носки в Смите | smith machine | external_total | 2.5 |
| canon:calf_machine | Подъём на носки в тренажёре | leverage machine | machine_stack | 5 |
| og:1379 | Подъём на носки с гантелями | dumbbell | per_dumbbell | 2 |
| og:0594 | Подъём на носки сидя в тренажёре | leverage machine | machine_stack | 5 |
| og:1370 | Подъём на носки со штангой | barbell | external_total | 2.5 |
| og:1373 | Подъём на носки стоя | body weight | bodyweight_only | не применяется |
| og:0472 | Подъём ног в висе | body weight | bodyweight_only | не применяется |
| canon:captain_leg_raise | Подъём ног в упоре на брусьях | body weight | bodyweight_only | не применяется |
| og:0475 | Подъём ног лёжа | body weight | bodyweight_only | не применяется |
| og:0162 | Подъём рук перед собой на блоке | cable | machine_stack | 5 |
| og:0041 | Подъём штанги перед собой | barbell | external_total | 2.5 |
| og:0168 | Приведение ноги в кроссовере | cable | machine_stack | 5 |
| og:0750 | Присед в Смите | smith machine | external_total | 2.5 |
| og:1385 | Присед в тренажёре | leverage machine | machine_stack | 5 |
| canon:high_bar_squat | Присед со штангой с высокой постановкой грифа | barbell | external_total | 2.5 |
| og:1435 | Присед со штангой с низкой постановкой грифа | barbell | external_total | 2.5 |
| og:3168 | Приседания с собственным весом | body weight | bodyweight_only | не применяется |
| og:2612 | Прыжки на скакалке | rope | time | не применяется |
| og:2285 | Пуловер в тренажёре | leverage machine | machine_stack | 5 |
| canon:cable_pullover | Пуловер с верхнего блока с рукояткой стоя | cable | machine_stack | 5 |
| canon:db_pullover | Пуловер с одной гантелью лёжа | dumbbell | per_dumbbell | 2 |
| og:0308 | Разведение гантелей лёжа | dumbbell | per_dumbbell | 2 |
| og:2470 | Разведение гантелей на заднюю дельту | dumbbell | per_dumbbell | 2 |
| canon:rear_delt | Разведение на заднюю дельту | dumbbell | per_dumbbell | 2 |
| canon:hip_abduction | Разведение ног в тренажёре | leverage machine | machine_stack | 5 |
| og:3697 | Разведение рук на заднюю дельту в кроссовере | cable | machine_stack | 5 |
| og:0082 | Разгибание кистей | barbell | external_total | 2.5 |
| canon:leg_extension | Разгибание ног в тренажёре | leverage machine | machine_stack | 5 |
| canon:db_overhead_triceps | Разгибание одной гантели из-за головы | dumbbell | per_dumbbell | 2 |
| canon:cable_one_arm_overhead_triceps | Разгибание одной руки из-за головы на блоке | cable | machine_stack | 5 |
| og:0194 | Разгибание рук из-за головы на блоке | cable | machine_stack | 5 |
| canon:rope_pushdown | Разгибание рук на верхнем блоке с канатом | cable | machine_stack | 5 |
| canon:straight_bar_pushdown | Разгибание рук на верхнем блоке с прямой рукоятью | cable | machine_stack | 5 |
| og:0149 | Разгибание руки на блоке | cable | machine_stack | 5 |
| og:0306 | Разгибание руки с гантелью | dumbbell | per_dumbbell | 2 |
| og:1459 | Румынская тяга с гантелями | dumbbell | per_dumbbell | 2 |
| canon:barbell_rdl | Румынская тяга со штангой | barbell | external_total | 2.5 |
| canon:russian_twist | Русские повороты | body weight | bodyweight_only | не применяется |
| og:0846 | Русские повороты с весом | weighted | external_total | 2.5 |
| canon:kettlebell_snatch | Рывок гири | kettlebell | external_total | 4 |
| canon:hip_adduction | Сведение ног в тренажёре | leverage machine | machine_stack | 5 |
| canon:cable_crossover | Сведение рук в кроссовере | cable | machine_stack | 5 |
| canon:high_to_low_crossover | Сведение рук в кроссовере сверху вниз | cable | machine_stack | 5 |
| canon:pec_deck | Сведение рук в тренажёре | leverage machine | machine_stack | 5 |
| canon:db_supination_curl | Сгибание гантелей с супинацией | dumbbell | per_dumbbell | 2 |
| og:1411 | Сгибание кистей | barbell | external_total | 2.5 |
| canon:lying_leg_curl | Сгибание ног лёжа в тренажёре | leverage machine | machine_stack | 5 |
| og:0599 | Сгибание ног сидя в тренажёре | leverage machine | machine_stack | 5 |
| og:0795 | Сгибание одной ноги стоя в тренажёре | body weight | bodyweight_only | не применяется |
| canon:cable_curl | Сгибание рук на нижнем блоке | cable | machine_stack | 5 |
| canon:cable_reverse_curl | Сгибание рук на нижнем блоке обратным хватом | cable | machine_stack | 5 |
| og:0059 | Сгибание рук на скамье Скотта | barbell | external_total | 2.5 |
| og:1633 | Сгибание рук на скамье Скотта на блоке | cable | machine_stack | 5 |
| canon:preacher_ez | Сгибание рук на скамье Скотта с EZ-штангой | ez barbell | external_total | 2.5 |
| og:0285 | Сгибание рук с гантелями | dumbbell | per_dumbbell | 2 |
| og:0315 | Сгибание рук с гантелями на наклонной скамье | dumbbell | per_dumbbell | 2 |
| og:0447 | Сгибание рук с EZ-штангой | ez barbell | external_total | 2.5 |
| canon:barbell_curl | Сгибание рук со штангой | barbell | external_total | 2.5 |
| og:1646 | Сгибание руки на скамье Скотта с гантелью | dumbbell | per_dumbbell | 2 |
| og:1670 | Сгибание руки с гантелью | dumbbell | per_dumbbell | 2 |
| og:0262 | Скручивания | body weight | bodyweight_only | не применяется |
| og:0175 | Скручивания на верхнем блоке | cable | machine_stack | 5 |
| canon:decline_crunch | Скручивания на наклонной скамье | body weight | bodyweight_only | не применяется |
| og:0752 | Становая тяга в Смите | smith machine | external_total | 2.5 |
| og:0578 | Становая тяга в тренажёре | leverage machine | machine_stack | 5 |
| og:0157 | Становая тяга на блоке | cable | machine_stack | 5 |
| og:0300 | Становая тяга с гантелями | dumbbell | per_dumbbell | 2 |
| og:0032 | Становая тяга со штангой | barbell | external_total | 2.5 |
| og:0117 | Становая тяга сумо со штангой | barbell | external_total | 2.5 |
| canon:lat_pulldown | Тяга верхнего блока | cable | machine_stack | 5 |
| og:0245 | Тяга верхнего блока обратным хватом | cable | machine_stack | 5 |
| canon:one_arm_lat_pulldown | Тяга верхнего блока одной рукой | cable | machine_stack | 5 |
| og:0237 | Тяга верхнего блока прямыми руками | cable | machine_stack | 5 |
| og:1325 | Тяга верхнего блока широким хватом | cable | machine_stack | 5 |
| og:0293 | Тяга гантелей в наклоне | dumbbell | per_dumbbell | 2 |
| canon:one_arm_db_row | Тяга гантели к поясу одной рукой | dumbbell | per_dumbbell | 2 |
| og:0775 | Тяга к подбородку в Смите | smith machine | external_total | 2.5 |
| og:0246 | Тяга к подбородку на блоке | cable | machine_stack | 5 |
| og:0363 | Тяга к подбородку с гантелями | dumbbell | per_dumbbell | 2 |
| og:0120 | Тяга к подбородку со штангой | barbell | external_total | 2.5 |
| og:0432 | Тяга на прямых ногах с гантелями | dumbbell | per_dumbbell | 2 |
| canon:tbar_row | Тяга Т-грифа | leverage machine | machine_stack | 5 |
| canon:barbell_row | Тяга штанги в наклоне | barbell | external_total | 2.5 |
| canon:smith_bent_row | Тяга штанги в наклоне в Смите | smith machine | external_total | 2.5 |
| og:0118 | Тяга штанги в наклоне обратным хватом | barbell | external_total | 2.5 |
| canon:db_lying_triceps | Французский жим с гантелями лёжа | dumbbell | per_dumbbell | 2 |
| canon:ez_lying_triceps | Французский жим с EZ-штангой лёжа | ez barbell | external_total | 2.5 |
| og:0061 | Французский жим со штангой лёжа | barbell | external_total | 2.5 |
| og:1433 | Фронтальный присед в Смите | smith machine | external_total | 2.5 |
| og:0533 | Фронтальный присед с гирей | kettlebell | external_total | 4 |
| og:0024 | Фронтальный присед со штангой | barbell | external_total | 2.5 |
| og:0746 | Шраги в Смите | smith machine | external_total | 2.5 |
| og:0580 | Шраги в тренажёре | leverage machine | machine_stack | 5 |
| og:0220 | Шраги на блоке | cable | machine_stack | 5 |
| og:0305 | Шраги с гантелями | dumbbell | per_dumbbell | 2 |
| og:0095 | Шраги со штангой | barbell | external_total | 2.5 |
| unvrsl:hip-thrust-smith | Ягодичный мост в Смите | smith machine | external_total | 2.5 |
| unvrsl:hip-thrust-machine | Ягодичный мост в тренажёре | leverage machine | machine_stack | 5 |
| og:3523 | Ягодичный мост с опорой на скамью | body weight | bodyweight_only | не применяется |
| canon:barbell_hip_thrust | Ягодичный мост со штангой | barbell | external_total | 2.5 |
| og:0276 | Dead Bug | body weight | bodyweight_only | не применяется |
| og:0749 | Good Morning в Смите | smith machine | external_total | 2.5 |
| og:0044 | Good Morning со штангой | barbell | external_total | 2.5 |
