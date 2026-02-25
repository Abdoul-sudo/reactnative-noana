-- Allow customers to create reviews only for restaurants where they have a delivered order (Story 5.7)
CREATE POLICY "reviews_insert_delivered_customer"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.user_id = auth.uid()
        AND orders.restaurant_id = reviews.restaurant_id
        AND orders.status = 'delivered'
    )
  );
