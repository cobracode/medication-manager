import { Resource } from "sst";
import { Example } from "@medication-manager/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);
