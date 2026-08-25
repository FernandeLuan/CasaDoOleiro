const app=document.getElementById('app');
let navRoot=document.getElementById('navRoot');
if(!navRoot){
  navRoot=document.createElement('div');
  navRoot.id='navRoot';
  app.insertAdjacentElement('afterend',navRoot);
}
const modalRoot=document.getElementById('modalRoot');
const toastEl=document.getElementById('toast');
