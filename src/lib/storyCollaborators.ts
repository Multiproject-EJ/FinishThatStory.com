export type StoryCollaborator = {
  id: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
};

export function createPlaceholderCollaborator(id: string): StoryCollaborator {
  return {
    id,
    displayName: `Contributor ${id.slice(0, 6)}`,
    role: "Collaborator",
    avatarUrl: null,
  };
}
