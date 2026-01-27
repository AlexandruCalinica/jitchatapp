/**
 * Utility functions for channel/document display formatting.
 * 
 * Note: Channel and document CRUD operations are now handled via TanStack DB
 * Electric collections in src/collections/. This file only contains display utilities.
 */

export function formatDocumentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  }
  
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
