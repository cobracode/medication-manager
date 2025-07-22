import { vpc } from './vpc'

export const mysql = new sst.aws.Mysql("MySql", {
    vpc,
    dev: {
        username: "root",
        password: "password",
        database: "local",
        port: 3306
    }
});
