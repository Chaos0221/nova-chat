-- Nova Chat Database Schema

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Conversation',
  model text not null default 'gemini-2.0-flash',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_model text not null default 'glm-4-flash',
  qwen_api_key text,
  kimi_api_key text,
  glm_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table conversations enable row level security;
alter table messages enable row level security;
alter table user_settings enable row level security;

create policy "Users own their conversations"
  on conversations for all using (auth.uid() = user_id);

create policy "Users own their messages"
  on messages for all using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users own their settings"
  on user_settings for all using (auth.uid() = user_id);

-- Auto-update updated_at on conversations
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
