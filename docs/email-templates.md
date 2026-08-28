# E-mails de acesso — Casa do Oleiro

O projeto permanece no plano Spark e usa o e-mail nativo do Firebase Authentication. Primeiro acesso e recuperação utilizam `sendPasswordResetEmail`, portanto compartilham o mesmo template de redefinição. Não há custo adicional de infraestrutura.

## Configuração no Firebase Console

Caminho: **Authentication → Templates → Password reset**.

Use o template correspondente ao idioma configurado no Firebase Authentication (`pt`, `en` ou `es`). O app já define `auth.languageCode` antes do envio.

Não alterar `%LINK%`: o Firebase substitui esse marcador pelo link seguro de ação.

---

## Português

**Assunto**

Casa do Oleiro | Defina ou redefina sua senha

**Mensagem**

Olá,

Recebemos uma solicitação para definir ou redefinir sua senha de acesso ao Portal de Voluntariado da Casa do Oleiro.

Use o link abaixo para criar uma nova senha:

%LINK%

Se este for seu primeiro acesso, esse link permitirá definir sua senha. Se você já utiliza o portal, ele permitirá redefinir a senha atual.

Se você não solicitou esta ação, ignore este e-mail.

Casa do Oleiro
Portal de Voluntariado

---

## English

**Subject**

Casa do Oleiro | Set or reset your password

**Message**

Hello,

We received a request to set or reset the password for your Casa do Oleiro Volunteer Portal account.

Use the link below to create a new password:

%LINK%

If this is your first access, the link will let you set your password. If you already use the portal, it will let you reset your current password.

If you did not request this action, you can ignore this email.

Casa do Oleiro
Volunteer Portal

---

## Español

**Asunto**

Casa do Oleiro | Define o restablece tu contraseña

**Mensaje**

Hola,

Recibimos una solicitud para definir o restablecer la contraseña de acceso al Portal de Voluntariado de Casa do Oleiro.

Usa el siguiente enlace para crear una nueva contraseña:

%LINK%

Si este es tu primer acceso, el enlace te permitirá definir tu contraseña. Si ya utilizas el portal, te permitirá restablecer tu contraseña actual.

Si no solicitaste esta acción, puedes ignorar este correo.

Casa do Oleiro
Portal de Voluntariado

## Regra de arquitetura

Não criar provedor de e-mail, servidor SMTP, Functions ou credenciais adicionais apenas para diferenciar primeiro acesso de recuperação. Se futuramente houver necessidade real de dois fluxos de e-mail distintos, a mudança deve ser tratada como uma decisão de arquitetura separada.
