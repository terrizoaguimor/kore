-- Set parent tenant organization
UPDATE organizations
SET slug = 'socios-del-negocio',
    is_parent_tenant = TRUE
WHERE slug = 'my-org';
