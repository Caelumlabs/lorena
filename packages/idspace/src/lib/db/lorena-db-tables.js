'use strict'

/**
 * Javascript Class to interact with Database.
 */
module.exports = [
    `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        type CHAR(1) NOT NULL DEFAULT ('S'),
        value TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS connections (
        linkId INTEGER PRIMARY KEY,
        roomId TEXT,
        matrixUser TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        leftAt DATETIME,
        status TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS contacts (
        did TEXT PRIMARY KEY,
        linkId INTEGER,
        diddoc TEXT,
        network TEXT,
        joinAt DATETIME,
        leaveAt DATETIME,
        status TEXT,
        type TEXT,
        name TEXT,
        level NOT NULL DEFAULT(0)
    );`,
    `CREATE TABLE IF NOT EXISTS members (
        did TEXT PRIMARY KEY,
        contactId INTEGER,
        givenName TEXT,
        familyName TEXT,
        additionalName TEXT,
        propertyID TEXT,
        roleName TEXT,
        extra TEXT,
        credential TEXT,
        status TEXT DEFAULT('requested'),
        publicKey TEXT,
        secretCode TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS recipes (
        recipeId INTEGER PRIMARY KEY,
        owner INTEGER,
        recipe TEXT,
        contactId INTEGER,
        currentStep INTEGER DEFAULT(1),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        closedAt DATETIME,
        status TEXT DEFAULT('open')
    );`,
    `CREATE TABLE IF NOT EXISTS steps (
        stepId INTEGER PRIMARY KEY,
        step INTEGER,
        recipeId INTEGER,
        threadId INTEGER DEFAULT(0),
        threadRef TEXT DEFAULT(''),
        contactId INTEGER,
        msgType TEXT,
        payload TEXT,
        data TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        closedAt DATETIME,
        type TEXT,
        status TEXT DEFAULT ('open')
    );`,
    `CREATE TABLE IF NOT EXISTS keys (
        did TEXT PRIMARY KEY,
        keyIndex INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        rotatedAt DATETIME,
        status TEXT,
        type TEXT,
        key TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS authorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        version TEXT,
        contactId INTEGER,
        status TEXT DEFAULT ('granted'),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS register (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        version TEXT,
        active BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        holder TEXT,
        issuer TEXT,
        name TEXT,
        description TEXT DEFAULT(''),
        location TEXT DEFAULT(''),
        extra TEXT DEFAULT(''),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        startedAt DATETIME,
        endedAt,
        status TEXT DEFAULT('sent'),
        action TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        did TEXT UNIQUE,
        type TEXT,
        title TEXT,
        url TEXT,
        description TEXT,
        requirements TEXT,
        expiration BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        startDate DATETIME,
        endDate DATETIME
    );`,
    `CREATE TABLE IF NOT EXISTS credentials_issued (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        did TEXT UNIQUE,
        credentialId INTEGER,
        contactId INTEGER DEFAULT(0),
        name TEXT,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        revokedAt DATETIME,
        credential TEXT,
        status TEXT DEFAULT('issued')
    );`,
    `CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idFrom INTEGER,
        idTo INTEGER,
        filename TEXT,
        ref TEXT
    );`
]
