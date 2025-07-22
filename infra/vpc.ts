export const vpc = new sst.aws.Vpc("Vpc", {
  az: 2,
  nat: "managed",
  bastion: true
});
