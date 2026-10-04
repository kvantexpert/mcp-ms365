# Permission Catalog

Каталог описывает возможные Graph permissions. Наличие permission здесь не означает, что оно выдано текущему token.

## Mail

- Mail.Read — чтение почты.
- Mail.ReadWrite — чтение и изменение почты. Не используется текущим read-only checkpoint.
- Mail.Send — отправка почты. Не используется текущим read-only checkpoint.

## Mailbox

- MailboxSettings.Read — чтение mailbox settings.

## Identity

- User.Read — чтение профиля пользователя.

## Rule

Catalog permission != requested scope != granted token scope.
