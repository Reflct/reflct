export const packageMenager = "npm";

export const getGlobalInstallCommand = (packageName: string) =>
  `${packageMenager} i -g ${packageName}`;

export const defaultValues = {
  projectName: "my-app",
};
