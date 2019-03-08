--
-- File generated with SQLiteStudio v3.2.1 on Fri Mar 8 04:22:05 2019
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: background
CREATE TABLE background (background_id INTEGER PRIMARY KEY NOT NULL UNIQUE, background_pos_x INTEGER NOT NULL, background_pos_y INTEGER NOT NULL, background_rotation DOUBLE NOT NULL DEFAULT (0), image_id TEXT REFERENCES image (image_id) NOT NULL, background_scale_x DOUBLE NOT NULL DEFAULT (1), background_scale_y DOUBLE NOT NULL DEFAULT (1));

-- Table: image
CREATE TABLE image (image_id INTEGER PRIMARY KEY NOT NULL UNIQUE, image_description TEXT, filepath TEXT NOT NULL);

-- Table: landmark
CREATE TABLE landmark (landmark_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_name TEXT, landmark_description TEXT, landmark_pos_x INTEGER NOT NULL, landmark_pos_y INTEGER NOT NULL, image_id INTEGER REFERENCES image (image_id) NOT NULL, landmark_rotation DOUBLE NOT NULL DEFAULT (0), landmark_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_scale_y DOUBLE NOT NULL DEFAULT (1));

-- Table: landmark_drawn
CREATE TABLE landmark_drawn (landmark_drawn_id INTEGER PRIMARY KEY UNIQUE NOT NULL, landmark_drawn_name TEXT, landmark_drawn_description TEXT, landmark_drawn_pos_x INTEGER NOT NULL, landmark_drawn_pos_y INTEGER NOT NULL, path_json TEXT NOT NULL, landmark_drawn_rotation DOUBLE NOT NULL DEFAULT (0), landmark_drawn_scale_x DOUBLE NOT NULL DEFAULT (1), landmark_drawn_scale_y DOUBLE NOT NULL DEFAULT (1));

-- Table: region
CREATE TABLE region (region_id INTEGER PRIMARY KEY NOT NULL UNIQUE, region_id_super INTEGER REFERENCES region (region_id), region_name TEXT, region_description TEXT);

-- Table: region_edge
CREATE TABLE region_edge (region_node_id_1 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_node_id_2 INTEGER REFERENCES region_node (region_node_id) NOT NULL, region_id INTEGER REFERENCES region (region_id));

-- Table: region_node
CREATE TABLE region_node (region_node_id INTEGER NOT NULL UNIQUE, region_node_pos_x INTEGER NOT NULL, region_node_pos_y INTEGER NOT NULL, PRIMARY KEY (region_node_id));

-- Table: road
CREATE TABLE road (road_id INTEGER NOT NULL UNIQUE, road_name TEXT, road_description TEXT);

-- Table: road_edge
CREATE TABLE road_edge (road_node_id_1 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_node_id_2 INTEGER REFERENCES road_node (road_node_id) NOT NULL, road_id INTEGER REFERENCES road (road_id));

-- Table: road_node
CREATE TABLE road_node (road_node_id INTEGER NOT NULL UNIQUE, road_node_pos_x INTEGER NOT NULL, road_node_pos_y INTEGER NOT NULL, PRIMARY KEY (road_node_id));

-- Table: text
CREATE TABLE text (text_id INTEGER PRIMARY KEY NOT NULL UNIQUE, text_pos_x INTEGER NOT NULL, text_pos_y INTEGER NOT NULL, text_rotation DOUBLE NOT NULL DEFAULT (0), content TEXT REFERENCES image (image_id) NOT NULL, text_scale_x DOUBLE NOT NULL DEFAULT (1), text_scale_y DOUBLE NOT NULL DEFAULT (1));

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
