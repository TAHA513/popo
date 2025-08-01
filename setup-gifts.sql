-- Insert default gift characters if they don't exist
INSERT INTO gift_characters (name, emoji, description, point_cost, animation_type, is_active, has_sound, has_special_effects, effect_duration)
VALUES 
  ('قلب', '❤️', 'قلب أحمر جميل', 10, 'bounce', true, false, false, 3),
  ('وردة', '🌹', 'وردة حمراء رومانسية', 25, 'float', true, false, true, 4),
  ('تاج', '👑', 'تاج ذهبي فاخر', 100, 'shine', true, false, true, 5),
  ('ألماسة', '💎', 'ألماسة براقة', 200, 'sparkle', true, true, true, 6),
  ('سيارة', '🚗', 'سيارة فاخرة', 500, 'drive', true, true, true, 7),
  ('طائرة', '✈️', 'طائرة خاصة', 1000, 'fly', true, true, true, 8),
  ('قلعة', '🏰', 'قلعة سحرية', 2000, 'magic', true, true, true, 10)
ON CONFLICT (name) DO NOTHING;