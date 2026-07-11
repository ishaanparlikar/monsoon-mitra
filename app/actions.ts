'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function updateChecklistItem(
  planId: string,
  itemId: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient() as any;

  const updates = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)
    .eq('plan_id', planId);

  if (error) {
    console.error('updateChecklistItem error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}