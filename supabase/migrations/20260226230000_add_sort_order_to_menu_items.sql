-- Add sort_order column to menu_items for drag-and-drop reordering
ALTER TABLE public.menu_items ADD COLUMN sort_order integer DEFAULT 0;

-- Backfill existing rows: assign sort_order based on created_at within each category
UPDATE public.menu_items
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY category_id ORDER BY created_at
  ) - 1 AS rn
  FROM public.menu_items
  WHERE deleted_at IS NULL
) sub
WHERE public.menu_items.id = sub.id;

-- Composite index for efficient sorted queries within a category
CREATE INDEX idx_menu_items_sort_order
  ON public.menu_items(category_id, sort_order)
  WHERE deleted_at IS NULL;
