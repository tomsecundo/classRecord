import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const vaults = sqliteTable('vaults', {
 userId: text('user_id').primaryKey(),
 payload: text('payload').notNull(),
 revision: integer('revision').notNull().default(1),
 updatedAt: text('updated_at').notNull(),
});

export const onlineWorkspaces=sqliteTable('online_workspaces',{
 userId:text('user_id').primaryKey(),revision:integer('revision').notNull().default(0),
});
export const onlineWorkspaceChunks=sqliteTable('online_workspace_chunks',{
 userId:text('user_id').notNull(),slot:integer('slot').notNull(),payload:text('payload').notNull(),
},table=>[primaryKey({columns:[table.userId,table.slot]})]);
