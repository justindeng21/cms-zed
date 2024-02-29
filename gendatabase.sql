use tsv5kvaqui9ri12y;

CREATE TABLE users (
    userId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    username varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    sessionCookie varchar(255) NOT NULL,
    salt varchar(255) NOT NULL,
    password varchar(500) NOT NULL,
    primary key (userId)
);

CREATE TABLE apps (
    appId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    appName varchar(255) NOT NULL,
    userId MEDIUMINT NOT NULL,
    primary key (appId),
    foreign key (userId) REFERENCES users (userId)
);

CREATE TABLE files (
    fileId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    appId MEDIUMINT not NULL,
    fileName varchar(255) NOT NULL,
    fileExtension varchar(255) NOT NULL,
    s3Key varChar(255) NOT NULL,
    primary key (fileId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (appId) REFERENCES apps (appId)
);

CREATE TABLE pages(
    pageId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    appId MEDIUMINT NOT NULL,
    title varChar(255) NOT NULL,
    primary key (pageId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (appId) REFERENCES apps (appId)
);

CREATE TABLE content (
    contentId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    pageId MEDIUMINT NOT NULL,
    s3Key varChar(255) NOT NULL,
    heading varChar(255) NOT NULL,
    primary key (contentId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (pageId) REFERENCES pages (pageId)
);

CREATE TABLE tags (
    tagId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    tagName varChar(255),
    userId MEDIUMINT NOT NULL,
    tag text NOT NULL,
    primary key (tagId),
    foreign key (userId) REFERENCES users (userId)
);

CREATE table templates (
    templateId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    templateName varChar(255),
    userId MEDIUMINT NOT NULL,
    template text NOT NULL,
    primary key (templateId),
    foreign key (userId) REFERENCES users (userId)
);

show tables;