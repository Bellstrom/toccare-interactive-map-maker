--
-- File generated with SQLiteStudio v3.2.1 on Tue Feb 12 01:08:26 2019
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: image
DROP TABLE IF EXISTS image;

CREATE TABLE image (
    image_id          INTEGER PRIMARY KEY
                              NOT NULL
                              UNIQUE,
    image_description TEXT,
    filepath          TEXT    NOT NULL
);


-- Table: landmark
DROP TABLE IF EXISTS landmark;

CREATE TABLE landmark (
    landmark_id          INTEGER PRIMARY KEY
                                 UNIQUE
                                 NOT NULL,
    landmark_name        TEXT,
    landmark_description TEXT,
    landmark_pos_x       INTEGER NOT NULL,
    landmark_pos_y       INTEGER NOT NULL,
    road_id              INTEGER REFERENCES road (road_id),
    region_id            INTEGER REFERENCES region (region_id),
    image_id             INTEGER REFERENCES image (image_id),
    landmark_rotation    INTEGER NOT NULL
);


-- Table: node
DROP TABLE IF EXISTS node;

CREATE TABLE node (
    node_id    INTEGER NOT NULL
                       UNIQUE,
    node_pos_x REAL    NOT NULL,
    node_pos_y REAL    NOT NULL,
    PRIMARY KEY (
        node_id
    )
);


-- Table: region
DROP TABLE IF EXISTS region;

CREATE TABLE region (
    region_id          INTEGER PRIMARY KEY
                               NOT NULL
                               UNIQUE,
    region_id_super    INTEGER REFERENCES region (region_id),
    region_name        TEXT,
    region_description TEXT
);


-- Table: region_edge
DROP TABLE IF EXISTS region_edge;

CREATE TABLE region_edge (
    node_id_1 INTEGER REFERENCES node (node_id),
    node_id_2 INTEGER REFERENCES node (node_id),
    region_id INTEGER REFERENCES region (region_id) 
                      NOT NULL
);


-- Table: road
DROP TABLE IF EXISTS road;

CREATE TABLE road (
    road_id          INTEGER NOT NULL
                             UNIQUE,
    road_name        TEXT,
    road_description TEXT
);


-- Table: road_edge
DROP TABLE IF EXISTS road_edge;

CREATE TABLE road_edge (
    node_id_1 INTEGER REFERENCES node (node_id),
    node_id_2 INTEGER REFERENCES node (node_id),
    road_id   INTEGER REFERENCES road (road_id),
    region_id INTEGER REFERENCES region (region_id) 
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
