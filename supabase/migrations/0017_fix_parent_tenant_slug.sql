-- Fix parent tenant slug - search by name
UPDATE organizations
SET slug = 'socios-del-negocio',
    is_parent_tenant = TRUE
WHERE name = 'Socios del negocio';

-- Also try by current slug pattern
UPDATE organizations
SET slug = 'socios-del-negocio',
    is_parent_tenant = TRUE
WHERE slug = 'my-org' OR slug LIKE 'socios%';
