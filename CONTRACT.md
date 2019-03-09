# Contract Tasks
## Task 1
### GUI: Does the software launch and display a menu bar, toolbar, image bank, and map area?
1. Launch Toccare Map Maker.
2. Verify that a menu bar appears at the top of the window.
3. Verify that a toolbar appears at the left side of the window.
4. Verify that a space containing the text “No images to display.” (the “image bank”) appears at the bottom of the window.
5. Verify that there is a rectangular space remaining in the window (the “map area”).
6. Test passes if steps 2-5 are verified.

## Task 2
### Map Display: Does a map appear in the map area?
1. Launch Toccare Map Maker.
2. Test passes if a grid appears in the map area.

## Task 3
### Map Panning: Can the map be panned?
1. Launch Toccare Map Maker.
2. Place cursor in map area, anywhere outside the central 3x3 set of squares.
3. Hold right click.
4. Move the cursor in a clockwise circle.
5. Verify that the map pans in a clockwise circle.
6. Verify that the cursor is in the same relative position on the map at the beginning and end of the circle.
7. Test passes if steps 5 and 6 are verified.

## Task 4
### Map Zooming: Can the map be zoomed in and out?
1. Launch Toccare Map Maker.
2. Place cursor anywhere in the map area.
3. Scroll up with the scroll wheel.
4. Verify that the grid increases in size.
5. Scroll down with the scroll wheel.
6. Verify that the grid decreases in size.
7. Test passes if steps 5 and 6 are verified.

## Task 5
### Import Image: Can an image be copied into the project from disk and displayed in the image bank?
1. Launch Toccare Map Maker.
2. Click on the plus button in the top right corner of the image bank.
3. Locate and open "gradient.png” in the /images folder.
4. Test passes if the image appears in the image bank.

## Task 6
### Set Background Image: Can the user set a tiling raster background image from the image bank?
1. Follow the steps in Task #5.
2. Right click on “gradient.png” in the image bank.
3. Click “Set as Background Image”.
4. Verify that a form opens in the center of the window.
5. In the form, type “3” in the “# of Horizontal Tiles” text box.
6. Type “5” in the “# of Vertical Tiles” text box.
7. Press OK.
8. Test passes if the map fills with copies of gradient.png such that there are 3 columns of 5 copies of the image.

## Task 7
### Place Background Element: Can the user place an image from the image bank in the map as a background image?
1. Follow the steps in Task #5 with "images/blue.png".
2. At the bottom of the tool bar, click on the button with the tree symbol (the “Background Layer button”).
3. Left click and drag “blue.png” from the image bank to the map area.
4. Release left click.
5. Test passes if the image now appears within the map area.

## Task 8
### Scale Background Element Horizontally: Can the user select and stretch a background element?
1. Follow the steps in Task #7.
2. Click on the image in the map area.
3. Verify that a border with 8 small squares appear around the image: one on each corner, one in the middle of each side, and one above the top of the image.
4. Click and drag the dot on the right side away from the center of the image.
5. Verify that the image is stretched horizontally in proportion with the moved dot.
6. Verify that the image is not stretched vertically by this process.
7. Click and drag the same dot towards the center of the image until it's close to its initial position.
8. Verify that the image is stretched horizontally in proportion with the moved dot.
9. Verify that the image is not stretched vertically by this process.
10. Repeat steps 3-6 with the dot on the left side.
11. Test passes if steps 3, 4, 5, 6, 8, 9, and 10 are verified.

## Task 9
### Scale Background Element Vertically: Can the user select and stretch a background element vertically?
1. Follow the steps in Task #7.
2. Click on the image in the map area.
3. Verify that 8 small dots appear around the image, one on each corner and one in the middle of each side.
4. Click and drag the dot on the top side away from the center of the image.
5. Verify that the image is stretched vertically in proportion with the moved dot.
6. Verify that the image is not stretched horizontally by this process.
7. Click and drag the same dot towards the center of the image until it's close to its initial position.
8. Verify that the image is stretched vertically in proportion with the moved dot.
9. Verify that the image is not stretched horizontally by this process.
10. Repeat steps 3-6 with the dot on the bottom side.
11. Test passes if steps 3, 4, 5, 6, 8, 9, and 10 are verified.

## Task 10
### Scale Background Element Diagonally: Can the user select and stretch a background element diagonally?
1. Follow the steps in Task #7.
2. Click on the image in the map area.
3. Verify that 8 small dots appear around the image, one on each corner and one in the middle of each side.
4. Click and drag the dot on the top left corner away from the center of the image.
5. Verify that the image is stretched vertically and horizontally in proportion with the moved dot.
6. Click and drag the same dot towards the center of the image until it's close to its initial position.
7. Verify that the image is stretched vertically and horizontally to its original size.
8. Repeat steps 3-6 with the dots in the other three corners.
9. Test passes if steps 3, 5, 7, and 8 are verified.

## Task 11
### Rotate Background Element: Can the user select and rotate a background element?
1. Follow the steps in Task #7.
2. Click and drag the dot extending above the image clockwise around the image.
3. Verify that the image rotates clockwise.
4. Click and drag the dot counterclockwise.
5. Verify that the image rotates counterclockwise.
6. Test passes if steps 3 and 5 are verified.

## Task 12
### Drag Background Element: Can the user select and drag a background element to a different position?
1. Follow the steps in Task #7.
2. Place the cursor over the image in the map area.
3. Click and drag the image in a circle.
4. Verify that the image moves with the cursor.
5. Click and drag the image to random positions, then release.
6. Verify that the image remains where it was dragged to.
7. Test passes if steps 4 and 6 are verified.

## Task 13
### Deselect Background Element: Can the user deselect a background element by both clicking outside of the element and by pressing the Escape key?
1. Follow the steps in Task #7.
2. Place the cursor outside the image in the map area, but still within the map area, and click.
3. Verify that the image is deselected (the border with 9 dots disappears).
4. Click on the image.
5. Press the Esc key.
6. Verify that the image is deselected.
7. Test passes if steps 3 and 6 are verified.

## Task 14
### Place Landmark: Can the user place an image from the image bank in the map as a landmark, scale it, and rotate it?
1. Follow the steps in Task #5.
2. At the bottom of the tool bar, click on the button with the house symbol (the “Landmark Layer button”).
3. Left click and drag "gradient.png” from the image bank to the map area.
4. Release left click.
5. Test passes if the image now appears within the map area.

## Task 15
### Manipulate Landmark: Can the user perform all operations on a landmark element that they can on a background element?
1. Follow the steps in Task #14.
2. Repeat Tasks 8-12 on this image.
3. Test passes if all five tasks pass.

## Task 16
### Delete Images: Can the user remove background and landmark elements from the map with the Delete key?
1. Follow the steps in Task #5.
2. Click on the image.
3. Press the Delete key.
4. Verify that the image is no longer in the map area.
5. Follow the steps in Task #14.
6. Click on the image.
7. Press the Delete key.
8. Verify that the image is no longer in the map area.
9. Test passes if steps 4 and 8 are verified.

## Task 17
### Differentiate Between Background and Landmark Layers: Can the user switch between the background and landmark layers with the tool bar?
1. Follow the steps in Tasks #7 and #14.
2. Click the Background Layer button.
3. Click on the background element.
4. Verify that the image is selected (the border with 8 dots appears).
5. Click on the landmark element.
6. Verify that the image is not selected.
7. Click the Landmark Layer button.
8. Verify that the background element is deselected.
9. Click on the landmark element.
10. Verify that the image is selected.
11. Click on the background element.
12. Verify that the image is not selected.
13. Click on the Background Layer button.
14. Verify that the background element is deselected.
15. Test passes if steps 4, 6, 8, 10, 12, and 14 are verified.

## Task 18
### Load Map Project: Can a map project be loaded from a set of project files?
1. Launch Toccare Map Maker.
2. Click on File in the menu bar.
3. Click Open
4. Verify that an open dialog box opens.
5. Locate and click on “test_project_open.tim”.
6. Click OK.
7. Test passes if a map with a tiled background image, placed background elements, and placed landmark elements appears.

## Task 19
### Close Map Project: Can the user close a map project without closing the software itself?
1. Follow the steps in Task #18.
2. Click File.
3. Click Close Project.
4. Verify that a dialog box appears.
5. Click OK.
6. Test passes if the map area changes to a blank, solid color, and the image bank is empty.

## Task 20
### Save New Map Project: Can a new map be saved to a set of project files?
1. Follow the steps in Tasks #7 and #14.
2. Scale, move, and rotate the landmark and background elements.
3. Click on File in the menu bar.
4. Click Save.
5. Verify that a save dialog box opens.
6. Type “test_project_save.tim” in the dialog box.
7. Click OK.
8. Close Toccare Map Maker.
9. Verify that a file named “test_project_save.tim” and a folder named “test_project_save” have appeared in the specified directory.
10. Repeat Task #9 on test_project_save.tim.
11. Test passes if the map loads in the same configuration as it was placed in steps 1-2.

## Task 21
### Save Existing Map Project: Can a previously saved map project be overwritten with new changes?
1. Follow the steps in Task #20.
2. Manipulate the background and landmark elements into different positions, sizes, and rotations than they were before.
3. Verify that the date modified tag on the test_project_save.tim file has changed.
4. Save the project, and close and relaunch Toccare Map Maker.
5. Test passes if the map loads in the same configuration as it was placed in step 2.

## Task 22
### “Save As” Map Project: Can a map project be saved to a different set of map project data with the Save As function?
1. Follow the steps in Task #20.
2. Manipulate the background and landmark elements into different positions, sizes, and rotations than they were before.
3. Click File.
4. Click Save As.
5. Save the project as “test_project_saveas.tim”
6. Verify that a file named “test_project_saveas.tim” and a folder named “test_project_saveas” have appeared in the specified directory.
7. Close and relaunch Toccare Map Maker.
8. Open test_project_saveas.tim.
9. Verify that the map loads in the same configuration as it was placed in step 2.
10. Open test_project_save.tim.
11. Verify that the map loads in the configuration it was placed in in step 1.
12. Test passes if steps 6, 9, and 11 are verified.


## Task 23
### Create New Project: Can the user open a new project with the “New Project” function?
1. Follow the steps in Task #18.
2. Click File.
3. Click New Project.
4. Click OK in the dialog box that appears.
5. Test passes if the previous map project disappears and the default project described in Task #2 appears.

## Task 24
### Store Information: When a landmark is double clicked, can the user type in text information and associate images with the landmark?
1. Follow the steps in Task #14.
2. Repeat Task #5 with “images/blue.png” and drag it into the map as in Task #14.
3. Click the Landmark Layer button.
3. Double click on the gradient.png in the map.
4. Verify that a form opens.
5. Type “Test Landmark” into the Name text input.
6. Type “This is test information.” into the Description text area.
7. Click and drag gradient.png from the image bank into the grey box on the right side of the form.
8. Repeat step 8 with blue.png.
9. Click OK.
10. Verify that the dialog box closes.
11. Double click on blue.png in the map.
12. Verify that a text box opens.
13. Click OK.
14. Double click on the gradient.png element.
15. Test passes if the information entered in steps 4-9 is displayed in the form.

## Task 25
### Road Draw Tool with Single Road: Can the user create a road with this tool?
1. Launch Toccare and click on the button with the road symbol in the tool bar (the Road Draw Tool).
2. Click on some place in the map.
3. Verify that a dot (a node) appears in the location clicked.
4. Click on a second place on the map.
5. Verify that a line segment appears connecting the two nodes.
6. Click a third place on the map.
7. Verify that a third line segment appears connecting the two most recent nodes.
8. Place a fourth node.
9. Verify that another line segment appears connecting nodes 3 and 4.
10. Test passes if steps 3, 5, 7, and 9 are verified.

## Task 26
### Road Draw Tool with Multiple Roads: Can the user use the Escape key to stop drawing a road and then draw a separate road?
1. Repeat Task #25.
2. Press the Escape key.
3. Click the map in four more places.
4. Verify that a new four-node road appears.
5. Verify that a line segment does not appear between the locations clicked before and after the Escape press.
6. Test passes if steps 4 and 5 are verified.

## Task 27
### Adjusting Nodes with Road Draw Tool: Can the user move parts of the road around by clicking and dragging?
1. Repeat Task #25.
2. Press the Escape key.
3. Click on the first node.
4. Verify that the node is highlighted.
5. Click and drag the node to a new location.
6. Repeat steps 3-5 with the other three nodes.
7. Test passes if the road segments are altered to remain connected to the nodes.

## Task 28
### Deleting Nodes with Road Draw Tool: Can the user remove sections of the road and collapse multiple sections into single sections?
1. Repeat Task #25.
2. Click on the fourth node.
3. Press the Delete key.
4. Verify that the fourth node and the line segment connecting the third and fourth nodes have been removed.
5. Click on the second node.
6. Press the Delete key.
7. Verify that the second node has been removed.
8. Verify that there is now a single line segment connecting the first and third nodes.
9. Test passes if steps 4, 7, and 8 are verified.

## Task 29
### Region Draw Tool: Can the user outline subsections of the map with this tool?
1. Select the tool with the continent symbol (the Region Draw tool).
2. Click on at least three different places on the map, outlining a contiguous area.
3. Verify that nodes and line segments appear along the places clicked.
4. Click the first node placed.
5. Verify that a dialog box appears.
6. Type “Test Region” into the text box.
7. Click OK.
8. Verify that “Test Region” is displayed within the outlined area.
9. Test passes if steps 3, 5, and 8 are verified.

## Task 30
### Alter Region with Region Draw Tool: Can the user move parts of the region around by clicking and dragging?
1. Repeat Task #29.
2. Select one of the nodes in the region.
3. Click and drag the node to a different position.
4. Test passes if the line segments change to fit the node’s position.

## Task 31
### Delete Region: Can the user remove a region with the Delete key?
1. Repeat Task #28.
2. Click on one of the edges of the region.
3. Verify that all of the nodes of the region are visible and highlighted.
4. Press the Delete key.
5. Test passes if the region is removed.

## Task 32
### Landmark Draw Tool: Can the user draw outlines that act as landmarks with this tool?
1. Launch Toccare and press the button with the pencil symbol (the Landmark Draw tool).
2. Click and drag around the map.
3. Verify that a line following the cursor's path has appear on the map.
4. Repeat steps 2 and 3 elsewhere on the map.
5. Press the button with the cursor symbol (the Select tool).
6. Click on the first drawn landmark.
7. Verify that the landmark is selected.
8. Double click on the second landmark.
9. Verify that the dialog box described in Task #25 appears.
10. Test passes if steps 3, 6, 7, and 9 are verified.

## Task 33 (New)
### Manipulate Drawn Landmark: Can the user apply transformations on drawn landmarks?
1. Repeat steps 1-7 in Task #32.
2. Click and drag, rotate, and resize the landmark.
3. Test passes if the landmark is modified.

## Task 34
### Delete Drawn Landmark: Can the user remove a drawn landmark with the Delete key?
1. Repeat Task #33.
2. Click on the second landmark drawn.
3. Press the Delete key.
4. Test passes if the landmark has been removed.

## Task 35
### Text Tool: Can the user type and place text onto the map with this tool?
1. Click the button with the T symbol (the Text tool).
2. Click somewhere in the map area.
3. Verify that a text cursor appears.
4. Type “Test text.”
5. Press the Esc key.
6. Test passes if the text remains on the map.

## Task 36 (New)
### Manipulate Text: Can the user apply transformations on text?
1. Repeat Task #35.
2. Press the Select tool button.
3. Click and drag, rotate, and resize the text.
3. Test passes if the text is modified.

## Task 37 (New)
### Edit Text
1. Repeat Task #35.
2. Double click on the text.
3. Change the text to "Test text 2."
4. Press the Esc key.
5. Test passes if the changed text remains on the map.

## Task 38
### Delete Text: Can the user remove text with the Delete key?
1. Repeat Task #35.
2. Select the text if it is not already selected.
3. Press the delete key.
4. Test passes if the text is removed from the map.

## Task 39 (New)
### Automatically Remove Empty Text Boxes: Do text boxes vanish from the map when empty?
1. Launch Toccare and press the Text tool button.
2. Click on the map to create a new text cursor.
3. Press the Esc key.
4. Click on the map elsewhere.
5. Type "Test text." and press the Esc key.
6. Double click on the text and remove its contents.
7. Press the Esc key.
8. Click on the Select tool button.
9. Left click and drag on the map to select the area that was clicked in steps 2-4.
10. Release left click.
11. Test passes if there are no empty text fields that have been selected.

## Task 40 (New)
### Set Text Tool Active when Editing Text: Does the software switch to the text tool when entering text edit mode?
1. Repeat Task #35.
2. Click the Select tool button.
3. Double click on the text.
4. Test passes if the text is in edit mode and the tool in the toolbar has changed to the Text tool.

## Task 41 (New)
### Set Select Tool Active when Dragging in Element: Does the software switch to the select tool when adding a landmark from the image bank?
1. Repeat Task #5.
2. Click on the Road Tool button.
3. Click and drag the image in the image bank onto the map.
4. Test passes if the image appears in the map and the tool in the toolbar has changed to the Select tool.

## Task 42 (New)
### Remove Background Image: Can the user remove a tiled background image from the menu bar?
1. Repeat Task #6.
2. Click on Edit > Remove Background Image in the menu bar at the top of the window.
3. Test passes if the tiled background image added in step 1 is removed from the map.

## Task 43 (New)
### Hide and Show Grid: Can the user hide and show the map grid from the menu bar?
1. Launch Toccare.
2. Click on Map > Show or Hide Grid in the menu bar at the top of the window.
3. Verify that the grid is removed from the map.
4. Click Map > Show or Hide Grid again.
5. Verify that the grid reappears.
3. Test passes if steps 3 and 5 are verified.

## Task 44
### Semi-Automated Road Vectorization Tool: Does this tool accurately find and convert roads in a toy problem?
1. Set the background image to “test_trace_background.png”.
2. Click the button with the symbol of the arrow on the road (the “Smart Road Draw tool”).
3. Place the cursor at the beginning of the road where the background image says “Start.”
4. Click within 20px of (but not directly on) each corner of the road in series from start to finish.
5. Test passes if the tool accurately places nodes and line segments along the road line.

## Task 45
### Export Embeddable Map: Can the map be exported to an embeddable HTML5 object which can be interacted with?
1. Load “test_project_embed.tim”.
2. Click File.
3. Click Export to HTML5.
5. Navigate to the /embed_test folder and click Save.
4. Copy the code in the dialog box that appears.
5. Open “/embed_test/map_data.html” in a text editor.
6. Replace “PLACE CODE HERE” with the copied code.
7. Save map_data.html.
8. Open embedded_map.html in Google Chrome.
9. Verify that the map is embedded in the webpage.
10. Verify that the map can be panned by clicking and dragging.
11. Verify that the map can be zoomed in and out with the scroll wheel.
12. Verify that information appears when a landmark is double clicked.
13. Test passes if steps 9-12 are verified.
