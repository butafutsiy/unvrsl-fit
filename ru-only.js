'use strict';
(()=>{
  const originalExercisesPage=exercisesPage;
  exercisesPage=function(){
    originalExercisesPage();
    const search=document.getElementById('exSearch');
    if(search)search.placeholder='Поиск упражнений';
    const head=document.querySelector('#exercises .catalog-head');
    if(head){
      const chip=head.querySelector('.chip');
      if(chip)chip.textContent='Русский · анимации';
    }
  };

  const originalRenderExerciseDetail=renderExerciseDetail;
  renderExerciseDetail=function(ex){
    originalRenderExerciseDetail(ex);
    document.querySelectorAll('.detail-en').forEach(el=>el.remove());
  };
})();
