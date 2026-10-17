-- CHANTIER 2 — 007 : seeds institutionnels uniquement (idempotents, aucune PII/démo)
-- 9 directions officielles (codes DIR-01..09, cf. cmsAndErpDefaults) comme org_units
-- racines + youtube_config désactivée par défaut + paramètres finance/features.
-- Aucun faux client, transaction, utilisateur, média.

insert into public.org_units (code, name, description, unit_type, position, is_active) values
  ('DIR-01', 'Direction Générale', 'Stratégie, contrôle interne, partenariats institutionnels.', 'direction', 1, true),
  ('DIR-02', 'Direction des Ressources Humaines', 'Talents, paie, formation, relations sociales.', 'direction', 2, true),
  ('DIR-03', 'Direction Administrative et Financière', 'Administration, comptabilité, trésorerie, achats.', 'direction', 3, true),
  ('DIR-04', 'Affaires Juridiques', 'Conformité, contrats, contentieux, propriété intellectuelle.', 'direction', 4, true),
  ('DIR-05', 'Ingénierie & Production Événementielle', 'Conseil, production, audiovisuel, diffusion.', 'direction', 5, true),
  ('DIR-06', 'Technique, Scénographie & Infrastructures', 'Son, lumière, LED, décoration, location.', 'direction', 6, true),
  ('DIR-07', 'Logistique, Hospitalité & Expérience Participant', 'Transport, protocole, billetterie, traiteur.', 'direction', 7, true),
  ('DIR-08', 'Communication, Marketing & Développement Digital', 'Marketing, RP, branding, digital.', 'direction', 8, true),
  ('DIR-09', 'Sécurité, Sûreté & Gestion des Risques', 'Gardiennage, sûreté VIP, prévention.', 'direction', 9, true)
on conflict (code) do update set name = excluded.name, description = excluded.description;

insert into public.youtube_config (id, channel_url, channel_id, channel_name, channel_description, is_enabled)
values ('main', '', '', '', '', false)
on conflict (id) do nothing;

insert into public.app_settings (key, value, category) values
  ('finance.defaults', '{"exchangeRateCDF": 2850, "vatRatePercent": 16, "doubleSignatureThresholdUSD": 100}', 'finance'),
  ('features.defaults', '{"quotesEnabled": true, "liveHubEnabled": true, "ticketingEnabled": true, "votingEnabled": true, "clientPortalEnabled": true, "visitorRadarEnabled": true, "maintenanceMode": false}', 'features'),
  ('contact.defaults', '{"phone": "", "email": "", "address": "Kinshasa / Gombe", "website": ""}', 'contact'),
  ('branding.defaults', '{"companyName": "VIVA EVENT SOLUTIONS"}', 'branding')
on conflict (key) do nothing;
