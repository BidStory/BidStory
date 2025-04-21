// dbManager.js

(function (global) {
  class DBManager {
    constructor(dbName) {
      this.dbName = dbName;
      this.db = new Dexie(dbName);
      this.schema = {};
    }

    async _upgradeDatabase() {
      this.db.close();
      this.db = new Dexie(this.dbName);
      this.db.version(Object.keys(this.schema).length || 1).stores(this.schema);
      await this.db.open();
      console.log(`تم فتح قاعدة البيانات ${this.dbName} بنجاح.`);
    }
    // [name, isKey, isUnique]
    async createTable(tableName, columns) {
      const keyColumn = columns.find((col) => col[1]);
      if (!keyColumn) throw new Error("يجب تحديد عمود كمفتاح رئيسي.");

      let schema = keyColumn[2] ? keyColumn[0] + "++" : keyColumn[0];

      columns.forEach((col) => {
        if (!col[1] && col[2]) schema += `,${col[0]}&`;
        else if (!col[1]) schema += `,${col[0]}`;
      });

      this.schema[tableName] = schema;
      await this._upgradeDatabase();
    }

    async getAllData(tableName) {
    
      if (!this.db[tableName]) throw new Error(`الجدول ${tableName} غير موجود.`);
      return await this.db[tableName].toArray();
    }
    getAllTableNames() {
      return Object.keys(this.schema);
    }
    async createIndexerTable(tableName) {
      this.schema[tableName] = "x";
      await this._upgradeDatabase();
    }

    async deleteTable(tableName) {
      delete this.schema[tableName];
      await this._upgradeDatabase();
    }

    async idGet(tableName, key) {
      return await this.db[tableName].get(key).then((obj) => obj?.y);
    }

    async idSet(tableName, key, value) {
      if (!this.db[tableName]) await this.createIndexerTable(tableName);
      await this.db[tableName].put({ x: key, y: value });
    }

    async idDelete(tableName, key) {
      await this.db[tableName].delete(key);
    }

    async exportTable2JSON(tableName) {
      const table = this.db[tableName];
      const schema = this.schema[tableName];

      const keyPath = schema.split(",")[0];
      const indexes = schema.split(",").slice(1).map((index) => index.replace("&", ""));

      const data = await table.toArray();

      return {
        storeName: tableName,
        keyPath,
        indexes,
        data,
      };
    }

    async importTableFromJSON({ storeName, data, keyPath = "id", indexes = [] }) {
      await this.deleteTable(storeName);

      const schema = [keyPath + "++", ...indexes.map((i) => (i.endsWith("&") ? i : i))].join(",");
      this.schema[storeName] = schema;
      await this._upgradeDatabase();

      await this.db[storeName].bulkPut(data);
    }
    
  }

  // تسجيل الكلاس في النافذة العالمية
  global.DBManager = DBManager;

})(window);
