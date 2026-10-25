-- 025 — Correction éditoriale du message de bienvenue officiel.
-- Remplace « notre établissement » par « notre société » dans la section
-- CMS publiée home.welcome.title (contenu de travail + contenu publié).
-- Idempotent : ne touche que les lignes contenant encore l'ancien libellé.

update public.cms_sections
set content = replace(content, 'notre établissement', 'notre société'),
    published_content = replace(published_content, 'notre établissement', 'notre société'),
    updated_at = now()
where content_key = 'home.welcome.title'
  and (
    content like '%notre établissement%'
    or published_content like '%notre établissement%'
  );

-- Contrôle : la ligne doit maintenant contenir « notre société ».
select content_key,
       (position('notre société' in coalesce(published_content, content)) > 0) as published_ok,
       (position('notre établissement' in coalesce(published_content, content)) > 0) as old_copy_remaining
from public.cms_sections
where content_key = 'home.welcome.title';
