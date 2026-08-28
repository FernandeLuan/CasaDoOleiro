/* Emergency contact translations shared by Admin and Volunteer Portal. */
(function emergencyContactI18n(){
  const messages={
    pt:{
      'emergency.title':'Contato de emergência','emergency.optional':'Opcional','emergency.none':'Não informado','emergency.name':'Nome do contato','emergency.relationship':'Relação / parentesco','emergency.phone':'Telefone / WhatsApp','emergency.add':'Adicionar contato','emergency.edit':'Editar contato','emergency.save':'Salvar','emergency.clear':'Remover','emergency.subtitle':'Usado somente se a equipe precisar falar com alguém em uma situação de emergência.','emergency.namePlaceholder':'Nome completo','emergency.relationshipPlaceholder':'Ex.: mãe, irmão, parceiro(a)','emergency.phonePlaceholder':'+55 ...','emergency.required':'Se informar um contato de emergência, preencha pelo menos o nome e o telefone.','emergency.saved':'Contato de emergência atualizado.','emergency.error':'Não foi possível atualizar o contato de emergência.','emergency.loading':'Carregando contato...'
    },
    en:{
      'emergency.title':'Emergency contact','emergency.optional':'Optional','emergency.none':'Not provided','emergency.name':'Contact name','emergency.relationship':'Relationship','emergency.phone':'Phone / WhatsApp','emergency.add':'Add contact','emergency.edit':'Edit contact','emergency.save':'Save','emergency.clear':'Remove','emergency.subtitle':'Used only if the team needs to reach someone in an emergency.','emergency.namePlaceholder':'Full name','emergency.relationshipPlaceholder':'E.g. mother, brother, partner','emergency.phonePlaceholder':'+1 ...','emergency.required':'If you provide an emergency contact, enter at least the name and phone number.','emergency.saved':'Emergency contact updated.','emergency.error':'Could not update the emergency contact.','emergency.loading':'Loading contact...'
    },
    es:{
      'emergency.title':'Contacto de emergencia','emergency.optional':'Opcional','emergency.none':'No informado','emergency.name':'Nombre del contacto','emergency.relationship':'Relación / parentesco','emergency.phone':'Teléfono / WhatsApp','emergency.add':'Agregar contacto','emergency.edit':'Editar contacto','emergency.save':'Guardar','emergency.clear':'Eliminar','emergency.subtitle':'Se usa únicamente si el equipo necesita comunicarse con alguien en una situación de emergencia.','emergency.namePlaceholder':'Nombre completo','emergency.relationshipPlaceholder':'Ej.: madre, hermano, pareja','emergency.phonePlaceholder':'+34 ...','emergency.required':'Si informas un contacto de emergencia, completa al menos el nombre y el teléfono.','emergency.saved':'Contacto de emergencia actualizado.','emergency.error':'No se pudo actualizar el contacto de emergencia.','emergency.loading':'Cargando contacto...'
    }
  };
  Object.entries(messages).forEach(([lang,rows])=>{if(window.OleiroI18nMessages?.[lang])Object.assign(window.OleiroI18nMessages[lang],rows)});
})();
