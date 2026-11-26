/* Comportamentos do Portal conectados à sessão real. */
window.volunteerHome=volunteerHome;window.volunteerPlan=volunteerPlan;
function renderVolunteer(){const pages={home:typeof volunteerHome==='function'?volunteerHome:null,plan:typeof volunteerPlan==='function'?volunteerPlan:null,agenda:typeof volunteerAgenda==='function'?volunteerAgenda:null,project:typeof window.volunteerProject==='function'?window.volunteerProject:null,stay:typeof volunteerStay==='function'?volunteerStay:null,info:typeof volunteerInfo==='function'?volunteerInfo:null,profile:typeof volunteerProfile==='function'?volunteerProfile:null};const pageFn=pages[state.volunteerPage]||pages.home;let content='';try{if(typeof pageFn!=='function')throw new Error('Módulo do portal indisponível.');content=pageFn()}catch(error){console.error('Erro ao renderizar portal:',error);content=`<section class="section"><div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>${escapeHtml(t('common.errorOpenTitle'))}</strong><br>${escapeHtml(t('common.errorOpenBody'))}</div></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="navigateVolunteer('home')">${escapeHtml(t('common.backHome'))}</button></section>`}app.innerHTML=header('',true)+`<main class="page">${content}</main>`;navRoot.innerHTML=volunteerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}window.syncPortalShareCooldownTimer?.()}
function render(){renderVolunteer()}
function planStatusFromApplication(status){return status==='adjustments'?'adjustments':status==='analysis'?'submitted':status==='approved'?'approved':status==='rejected'?'rejected':'draft'}
function portalPlanActivities(application,sessions){
  const byActivity=new Map();
  (sessions||[]).forEach(session=>{const id=String(session.activityId||'');if(!id)return;let activity=byActivity.get(id);if(!activity){activity={id,applicationId:String(application?.id||''),name:session.activityName||'Atividade',description:session.activityDescription||'',duration:Number(session.duration)||60,participation:session.participation||'Livre',materials:session.materials||'',notes:session.notes||'',period:activityPeriodValue(session),time:session.time||'',ownerName:session.ownerName||'',createdByUid:session.createdByUid||'',managerCreated:session.managerCreated===true,postApprovalProposal:session.postApprovalProposal===true,reviewStatus:session.reviewStatus||'',reviewNote:session.reviewNote||'',dates:[]};byActivity.set(id,activity)}if(session.date&&!activity.dates.includes(session.date))activity.dates.push(session.date);if(!activity.time&&session.time)activity.time=session.time;if(session.managerCreated===true)activity.managerCreated=true;if(session.postApprovalProposal===true){activity.postApprovalProposal=true;activity.reviewStatus=session.reviewStatus||activity.reviewStatus;activity.reviewNote=session.reviewNote||activity.reviewNote}});
  byActivity.forEach(activity=>activity.dates.sort());return [...byActivity.values()];
}
function applyVolunteerPlanningRows(application,sessions){
  state.sessions=sessions||[];state.activities=portalPlanActivities(application,state.sessions);state.sessionStatus={};state.sessionGroups={};
  state.sessions.forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});state.volunteerPlanningLoadedFor=String(application.id);state.volunteerPlanningFailedFor=null;
}
async function resetEmptyAdjustmentState(application){
  if(!application?.id||application.status!=='adjustments'||!window.OleiroServices?.applications?.update)return;
  try{await window.OleiroServices.applications.update(application.id,{status:'pending',planningSubmittedAt:null,dayAdjustments:{}});application.status='pending';application.planningSubmittedAt=null;application.dayAdjustments={};state.volunteerPlanStatus='draft'}catch(error){console.warn('Não foi possível normalizar o planejamento vazio:',error)}
}
async function portalPlanningWithDeadline(task,label='Carregamento do planejamento',timeoutMs=12000){
  let timer;
  try{return await Promise.race([
    Promise.resolve().then(task),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' excedeu o tempo limite.')),timeoutMs)})
  ])}finally{clearTimeout(timer)}
}
async function hydrateVolunteerPlanning(application,{force=false}={}){
  if(!application?.id){state.volunteerPlanningLoadedFor='';state.volunteerPlanningFailedFor=null;return []}
  const applicationId=String(application.id);if(!force&&state.volunteerPlanningLoadedFor===applicationId)return state.sessions||[];
  if(!window.OleiroServices?.planning?.listSessions){const error=new Error('Serviço de planejamento indisponível.');state.volunteerPlanningFailedFor=applicationId;state.volunteerPlanningError=error.message;throw error}
  const candidate=state.volunteerMode!=='approved',declaredEmpty=candidate&&Number(application.sessionCount||0)===0&&Number(application.activityCount||0)===0;
  state.volunteerPlanningFailedFor=null;state.volunteerPlanningError='';
  try{
    if(!force&&declaredEmpty&&window.OleiroServices.planning.hasSessions){
      applyVolunteerPlanningRows(application,[]);
      const hasAny=await portalPlanningWithDeadline(()=>window.OleiroServices.planning.hasSessions({applicationId}));
      if(!hasAny){await portalPlanningWithDeadline(()=>resetEmptyAdjustmentState(application),'Atualização do planejamento');return []}
    }
    const sessions=await portalPlanningWithDeadline(()=>window.OleiroServices.planning.listSessions({applicationId}));
    applyVolunteerPlanningRows(application,sessions||[]);
    if(candidate&&state.sessions.length===0)await portalPlanningWithDeadline(()=>resetEmptyAdjustmentState(application),'Atualização do planejamento');
    return state.sessions;
  }catch(error){
    state.volunteerPlanningFailedFor=applicationId;state.volunteerPlanningError=String(error?.message||'Não foi possível carregar o planejamento.');
    throw error;
  }
}
async function bootVolunteer(){
  const session=await window.OleiroAuthGuard?.requireRole('volunteer');if(!session)return;state.role='volunteer';state.currentSession=session;state.currentApplication=session.application||null;state.volunteerMode=session.mode||'candidate';state.volunteerPlanStatus=planStatusFromApplication(session.application?.status);state.volunteerPage='home';state.activities=[];state.sessions=[];state.volunteerPlanningLoadedFor=null;state.volunteerPlanningFailedFor=null;state.projectOnboardingStep=0;state.projectLoading=true;render();Promise.allSettled([hydrateVolunteerPlanning(session.application),window.OleiroProjects?.loadOwn?.({force:true})]).then(results=>{state.projectLoading=false;const failure=results.find(result=>result.status==='rejected');if(failure)console.error('Falha ao carregar dados do Portal:',failure.reason);render()});
}
function startVolunteerBoot(){void bootVolunteer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startVolunteerBoot,{once:true});else startVolunteerBoot();
