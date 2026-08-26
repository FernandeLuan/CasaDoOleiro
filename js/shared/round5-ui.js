/* Round 5 — pequenos ajustes textuais compartilhados. */
(function round5SharedUi(){
  function normalizeEmailLabels(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{const value=node.nodeValue||'';const next=value.replace(/E-mail/g,'Email').replace(/e-mail/g,'email');if(next!==value)node.nodeValue=next});
  }
  normalizeEmailLabels();
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE){const value=node.nodeValue||'';node.nodeValue=value.replace(/E-mail/g,'Email').replace(/e-mail/g,'email')}else if(node.nodeType===Node.ELEMENT_NODE)normalizeEmailLabels(node)})));
  observer.observe(document.body,{childList:true,subtree:true});
})();
