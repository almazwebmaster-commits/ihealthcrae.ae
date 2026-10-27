-- Link the original store subcategories to Google Merchant Center product categories
-- (google_product_category ids, see src/data/google-taxonomy.json). Only fills categories that have none.
UPDATE "Category" AS c SET "googleCategoryId" = m.gid
FROM (VALUES
  ('pain-fever', 518), ('cold-flu', 518), ('digestive', 518), ('first-aid', 508),
  ('multivitamins', 525), ('vitamin-d', 525), ('omega-3', 525), ('immunity', 525),
  ('cleansers', 2526), ('moisturisers', 2592), ('sun-care', 2844), ('serums', 567),
  ('oral-care', 526), ('bath-body', 474), ('deodorants', 484), ('shaving', 528),
  ('diapers', 548), ('baby-food', 5719), ('baby-skincare', 4678), ('feeding', 561),
  ('blood-pressure', 495), ('thermometers', 501), ('glucose', 2246), ('nebulizers', 4552),
  ('protein', 5702), ('pre-workout', 2890), ('hydration', 2890), ('bars', 2984)
) AS m(slug, gid)
WHERE c.slug = m.slug AND c."googleCategoryId" IS NULL;
