export const queryClient = {
  invalidateQueries: async () => undefined,
  ensureQueryData: async <T>(_: string, loader: () => Promise<T>) => loader(),
};
