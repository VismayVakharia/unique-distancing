var elem = document.getElementById('draw');
var params = { type: Two.Types.svg, fullscreen: false, width: 700, height: 700 };
var two = new Two(params).appendTo(elem);

var params_ctrl = { type: Two.Types.svg, fullscreen: false, width: 400, height: 700 };
var two_ctrl = new Two(params_ctrl).appendTo(document.getElementById('draw'));

var grid_x = 6;  // number of rows
var grid_y = 6;  // number of columns

var gridType = "Cartesian";
var distanceType = "Euclidean";
var arrangement = Array();

var offset = 0;

function indicesFromID(id_) {
    let id = parseInt(id_.slice(4)) - offset;
    let row_index = 0;
    while (id > arrangement[row_index]) {
        id -= arrangement[row_index];
        row_index++;
    }
    return [row_index, id-1];
}

function getArrangement() {
    let arr = Array()
    for (let i=0; i<grid_x; i++){
        let h = (grid_x - 1)/2 - i;
        let num_shapes = (gridType == "Cartesian") ? grid_y: grid_y - Math.abs(h);
        arr.push(num_shapes);
    }
    return arr;;
}

function idFromIndices(indices) {
    let index = getArrangement().slice(0, indices[0]).reduce((a, b) => a + b, 0) + indices[1];
    let id = "two-" + String(index + 1 + offset);
    return [id, index];
}

function coordinatesFromIndices(indices, gridType_, disType) {
    if (gridType_ == "Cartesian") {
        return indices;
    } else if (gridType_ == "Hexagonal") {
        let h = (grid_x - 1)/2 - indices[0];
        if (disType == "Euclidean") {
            let num_shapes = grid_y - Math.abs(h);
            let x = indices[1] - (num_shapes-1)/2;
            let y = h * Math.sqrt(3) / 2;
            return [x, y];
        } else if (disType == "Manhattan") {
            let num_shapes = grid_y - Math.abs(h);
            let x = indices[1] - (num_shapes-1)/2 - h/2;
            let y = h;
            return [x, y];
        } else {
            return NaN;
        }
    } else {
        return NaN;
    }
}

function distance(id1, id2, gridType_, disType) {
    let x1, y1, x2, y2;
    [x1, y1] = coordinatesFromIndices(indicesFromID(id1), gridType_, disType);
    [x2, y2] = coordinatesFromIndices(indicesFromID(id2), gridType_, disType);
    if (disType == "Euclidean") {
        return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
    } else if (disType == "Manhattan") {
        let dx = x2 - x1;
        let dy = y2 - y1;
        if (gridType_ == "Cartesian") {
            return Math.abs(dx) + Math.abs(dy);
        } else if (gridType_ == "Hexagonal") {
            return (Math.sign(dx) == Math.sign(dy)) ? Math.abs(dx + dy): Math.max(Math.abs(dx), Math.abs(dy));
        }
    } else {
        return NaN;
    }
}

function drawDistance(shape1, shape2, gridType_, distType_, color) {
    let lines = Array();
    let x1 = shape1.position.x;
    let y1 = shape1.position.y;
    let x2 = shape2.position.x;
    let y2 = shape2.position.y;
    if (distType_ == "Euclidean") {
        lines.push(two.makeArrow((x1+x2)/2, (y1+y2)/2, x2, y2));
        lines.push(two.makeArrow((x2+x1)/2, (y2+y1)/2, x1, y1));
    } else if (distType_ == "Manhattan") {
        if (gridType_ == "Cartesian") {
            if (x1 == x2 || y1 == y2) {
                lines.push(two.makeArrow((x1+x2)/2, (y1+y2)/2, x2, y2));
                lines.push(two.makeArrow((x2+x1)/2, (y2+y1)/2, x1, y1));
            } else {
                lines.push(two.makeArrow(x2, y1, x1, y1));
                lines.push(two.makeArrow(x2, y1, x2, y2));
            }

        }
    }
    lines.forEach(function(line) {
        line.linewidth = 5;
        line.stroke = color;
        line.opacity = 0.5;
    })
    return lines;
}

function getDistNeighbors(id_, dist) {
    let x, y;
    [x, y] = indicesFromID(id);
    var array = Array();
    for (let i=0; i<grid_x; i++) {
        for (let j=0; j<grid_y; j++) {
            let curr_id = (i+1)*grid_y + j;
            if (Math.abs(distance(id_, "two-"+curr_id, gridType, distanceType) - dist) < 1e-8) {
                array.push(curr_id);
            }
        }
    }
    return array;
}

function updateDistances() {
    distances = Array();
    selection.forEach(function(cell1, index) {
        selection.forEach(function(cell2, index) {
            let dist = distance(cell1.id, cell2.id, gridType, distanceType);
            if (!distances.includes(dist) && dist != 0) {
                distances.push(dist);
            }
        })
    })
}

function blockCells(flagHover=false) {
    updateDistances();
    blockedCells.splice(0, blockedCells.length);
    shapesArray.forEach(function(shape, index) {
        symmetry_dists = Array();
        if (flagHover) {
            if (shape.fill == "#999999") {
                shape.fill = 'rgba(200, 200, 255, 0.2)';
            }
        } else {
            if (shape.fill == "#000000" || shape.fill == "#999999") {
                shape.fill = 'rgba(200, 200, 255, 0.2)';
            }
        }
        selection.forEach(function(cell, index) {
            let curr_dist;
            curr_dist = distance(cell.id, shape.id, gridType, distanceType);
            distances.forEach(function(dist, index) {
                if (Math.abs(curr_dist - dist) < 1e-8) {
                    if (shape.fill == 'rgba(200, 200, 255, 0.2)') {
                        if (!flagHover) {
                            shape.fill = "#000000";
                        }
                        blockedCells.push(shape);
                    }
                }
            })
            symmetry_dists.forEach(function(dist, index) {
                if (Math.abs(curr_dist - dist) < 1e-8) {
                    if (shape.fill == 'rgba(200, 200, 255, 0.2)') {
                        if (!flagHover) {
                            shape.fill = "#000000";
                        }
                        blockedCells.push(shape);
                    }
                }
            })
            symmetry_dists.push(curr_dist);
        })
    })
    return blockedCells;
}

function validateSelection() {
    let l = selection.length;
    let dists = Array();
    for (let i=0; i < l; i++) {
        for (let j=i+1; j < l; j++) {
            let dist = distance(selection[i].id, selection[j].id, gridType, distanceType);
            for (other_dist in dists) {
                if (Math.abs(other_dist - dist) < 1e-8) {
                    console.log("Conflict", selection[i], selection[j]);
                    let lines = Array();
                    lines = lines.concat(drawDistance(selection[i], selection[j], gridType, distanceType, "red"));
                    let other1, other2;
                    [other1, other2] = dists[other_dist];
                    lines = lines.concat(drawDistance(other1, other2, gridType, distanceType, "green"));
                    window.setTimeout(function(e) {
                        for (line_index in lines) {
                            two.remove(lines[line_index]);
                        }
                    }, 2000)
                    return false;
                }
            }
            dists[dist] = [selection[i], selection[j]];
        }
    }
    return true;
}

function getURL() {
    var settings = "settings=";
    settings += (gridType == "Cartesian") ? "0," : "1,";
    settings += String(grid_x) + ",";
    settings += String(grid_y) + ",";
    settings += (distanceType == "Euclidean") ? "0" : "1";

    var selectionString = "selection=";
    for (let i=0; i < selection.length; i++) {
        let x, y;
        [x, y] = indicesFromID(selection[i].id);
        selectionString += String(x) + "," + String(y) + ";";
    }
    return settings + "&" + selectionString.slice(0, selectionString.length-1);
}

function getQuery(key) {
  var pat = new RegExp(key + "=([^&]+)");
  var res = pat.exec(window.location.search);
  return res ? res[1] : null;
}

function setURL() {
    let settings = getQuery("settings").split(",").map(x=>parseInt(x));
    gridType = (!settings[0]) ? "Cartesian": "Hexagonal";
    grid_x = settings[1];
    grid_y = settings[2];
    distanceType = (!settings[3]) ? "Euclidean": "Manhattan";

    renderScene();
    renderControls();

    let selectionString = getQuery("selection");

    if (selectionString) {
        selectionString.split(";").forEach(function(indices) {
            let id, ix;
            [id, ix] = idFromIndices(indices.split(",").map(x=>parseInt(x)));
            cell = shapesArray[ix];
            $(cell._renderer.elem).mouseover();
            $(cell._renderer.elem).click();
            $(cell._renderer.elem).mouseout();
        });
    }
    return;
}

var styles = {
  alignment: "center",
  size: 20,
  family: "Lato"
};

var text16_rect, text17_rect, text1_rect, text2_rect;
var text15, text16, text17, text1, text2;
var shapesArray = Array();
var selection = Array();
var distances = Array();
var blockedCells = Array();

function renderScene() {
    two.clear();

    var spacing_x = Math.floor(two.width/(grid_y + 1));
    var spacing_y = Math.floor(two.height/(grid_x + 1));
    var spacing = Math.min(spacing_x, spacing_y);
    var y_offset = two.height/2 - spacing * (grid_x-1)/2;
    var radius = Math.floor(spacing * 0.4);

    arrangement.splice(0, arrangement.length);
    shapesArray.splice(0, shapesArray.length);
    selection.splice(0, selection.length);
    distances.splice(0, distances.length);

    for (let i=0; i<grid_x; i++){
        let h = (grid_x - 1)/2 - i;
        let num_shapes = (gridType == "Cartesian") ? grid_y: grid_y - Math.abs(h);
        for (let j=0; j<num_shapes; j++){
            var x_offset = two.width/2 - spacing * (num_shapes-1)/2;
            let x = x_offset + spacing * j;
            let y = (gridType == "Cartesian") ? y_offset + spacing * i: y_offset + spacing * i * Math.sqrt(3)/2;
            let shape = two.makeCircle(x, y, radius);
            shape.fill = 'rgba(200, 200, 255, 0.2)';
            shape.linewidth = 1;
            shape.stroke = '#1C75BC';
            shape.rotation = (gridType == "Cartesian") ? 0: Math.PI/2;
            shapesArray.push(shape);
        }
        arrangement.push(num_shapes);
    }

    offset = parseInt(shapesArray[0].id.slice(4)) - 1;
    console.log("offset", offset);

    two.update();

    shapesArray.forEach(function(shape, index){
        // two.bind('update', function(frameCount, timeDelta) {
        //     shape.rotation = frameCount / 60;
        //   });
        $(shape._renderer.elem)
           .css('cursor', 'pointer')
           .hover(function(e) {
               shape.linewidth = 2;
               shape.stroke = "#000000";
               if (shape.fill == 'rgba(200, 200, 255, 0.2)') {
                   shape.fill = "#FFE86E";
                   selection.push(shape);
                   let cells = blockCells(true);
                   cells.forEach(function(cell, index) {
                       if (cell.fill != "#000000") {
                           cell.fill = "#999999";
                       }
                   })
               } else if (shape.fill == "#FFD700") {
                   shape.fill = 'rgba(200, 200, 255, 0.5)';
                   let index = selection.indexOf(shape);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
                   selection.push(shape);
                   let cells = blockCells(true);
                   cells.forEach(function(cell, index) {
                       if (cell.fill != "#000000") {
                           cell.fill = "#999999";
                       }
                   })
               }
           }, function(e) {
               shape.linewidth = 1;
               shape.stroke = "#1C75BC";
               if (shape.fill == "#FFE86E") {
                   shape.fill = 'rgba(200, 200, 255, 0.2)';
                   let index = selection.indexOf(shape);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
               } else if (shape.fill == 'rgba(200, 200, 255, 0.5)') {
                   shape.fill = "#FFD700";
                   blockCells();
               }
           })
           .click(function(e) {
               if (shape.fill == "#FFE86E") {
                   shape.fill = "#FFD700";
                   // selection.push(shape);
                   blockCells();
                   console.log(shape.id, "selected");
               }
               else if (shape.fill == 'rgba(200, 200, 255, 0.5)') {
                   shape.fill = 'rgba(200, 200, 255, 0.2)';
                   let index = selection.indexOf(shape);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
                   console.log(shape.id, "deselected");
               }
               // two.update();
           });
    })

    blockCells();
}

function renderControls() {

    text1_rect = two_ctrl.makeRoundedRectangle(50, 18, 95, 30, 5);
    text2_rect = two_ctrl.makeRoundedRectangle(250, 18, 95, 30, 5);
    text1_rect.fill = '#FFFFFF';
    text2_rect.fill = '#FF0000';

    text1 = two_ctrl.makeText("Clear", 50, 20, styles);
    text2 = two_ctrl.makeText("Reset", 250, 20, styles);
    text2.weight = 800;
    text1.fill = "#000000";
    text2.fill = "#FFFFFF";


    text4_rect = two_ctrl.makeRoundedRectangle(110, 98, 100, 30, 5);
    text5_rect = two_ctrl.makeRoundedRectangle(220, 98, 100, 30, 5);
    // text6_rect = two_ctrl.makeRoundedRectangle(295, 98, 110, 30, 5);
    text4_rect.fill = (gridType == "Cartesian") ? '#0366d6' : "#FFFFFF";
    text5_rect.fill = (gridType == "Cartesian") ? '#FFFFFF' : "#0366d6";
    // text6_rect.fill = "#FFFFFF";
    text4_rect.noStroke();
    text5_rect.noStroke();
    // text6_rect.noStroke();

    text3 = two_ctrl.makeText("Grid: ", 21, 100, styles);
    text4 = two_ctrl.makeText("Cartesian", 110, 100, styles);
    text5 = two_ctrl.makeText("Hexagonal", 220, 100, styles);
    // text6 = two_ctrl.makeText("Hexagonal", 295, 100, styles);
    text4.fill = (gridType == "Cartesian") ? "#FFFFFF" : "#000000";
    text5.fill = (gridType == "Cartesian") ? "#000000" : "#FFFFFF";
    // text6.fill = "#000000";


    text8_rect = two_ctrl.makeRoundedRectangle(120, 148, 40, 30, 5);
    text9_rect = two_ctrl.makeRoundedRectangle(170, 148, 50, 30, 5);
    text10_rect = two_ctrl.makeRoundedRectangle(220, 148, 40, 30, 5);
    text8_rect.fill = "#FFFFFF";
    text9_rect.fill = "#0366d6";
    text10_rect.fill = "#FFFFFF";
    text8_rect.noStroke();
    text9_rect.noStroke();
    text10_rect.noStroke();

    text7 = two_ctrl.makeText("Rows: ", 24, 150, styles);
    text8 = two_ctrl.makeText("<", 120, 150, styles);
    text9 = two_ctrl.makeText(String(grid_x), 170, 150, styles);
    text10 = two_ctrl.makeText(">", 220, 150, styles);
    text8.fill = "#000000";
    text9.fill = "#FFFFFF";
    text10.fill = "#000000";


    text12_rect = two_ctrl.makeRoundedRectangle(120, 198, 40, 30, 5);
    text13_rect = two_ctrl.makeRoundedRectangle(170, 198, 50, 30, 5);
    text14_rect = two_ctrl.makeRoundedRectangle(220, 198, 40, 30, 5);
    text12_rect.fill = "#FFFFFF";
    text13_rect.fill = "#0366d6";
    text14_rect.fill = "#FFFFFF";
    text12_rect.noStroke();
    text13_rect.noStroke();
    text14_rect.noStroke();

    text11 = two_ctrl.makeText("Columns: ", 40, 200, styles);
    text12 = two_ctrl.makeText("<", 120, 200, styles);
    text13 = two_ctrl.makeText(String(grid_y), 170, 200, styles);
    text14 = two_ctrl.makeText(">", 220, 200, styles);
    text12.fill = "#000000";
    text13.fill = "#FFFFFF";
    text14.fill = "#000000";


    text16_rect = two_ctrl.makeRoundedRectangle(140, 248, 95, 30, 5);
    text17_rect = two_ctrl.makeRoundedRectangle(250, 248, 105, 30, 5);
    text16_rect.fill = (distanceType == "Euclidean") ? '#0366d6' : "#FFFFFF";
    text17_rect.fill = (distanceType == "Euclidean") ? '#FFFFFF' : "#0366d6";
    text16_rect.noStroke();
    text17_rect.noStroke();

    text15 = two_ctrl.makeText("Distance: ", 40, 250, styles);
    text16 = two_ctrl.makeText("Euclidean", 140, 250, styles);
    text17 = two_ctrl.makeText("Manhattan", 250, 250, styles);
    text16.fill = (distanceType == "Euclidean") ? "#FFFFFF" : "#000000";
    text17.fill = (distanceType == "Euclidean") ? "#000000" : "#FFFFFF";


    text18_rect = two_ctrl.makeRoundedRectangle(50, 548, 95, 30, 5);
    // text19_rect = two_ctrl.makeRoundedRectangle(160, 548, 105, 30, 5);
    text18_rect.fill = "#FFFFFF";
    // text19_rect.fill = "#FFFFFF";
    // text18_rect.noStroke();
    // text19_rect.noStroke();

    text18 = two_ctrl.makeText("Validate?", 50, 550, styles);
    text19 = two_ctrl.makeText("", 160, 550, styles);
    text18.fill = "#000000";
    text19.fill = "#000000";
    text19.weight = 800;


    text20_rect = two_ctrl.makeRoundedRectangle(50, 598, 95, 30, 5);
    text20_rect.fill = "#FFFFFF";
    // text20_rect.noStroke();

    text20 = two_ctrl.makeText("Share", 50, 600, styles);
    text21 = two_ctrl.makeText("", 120, 600, styles);
    text20.fill = "#000000";
    text21.fill = "#000000";
    text21.weight = 800;
    text21.alignment = "left";
    text21.decoration = "underline";

    text21_rect = two_ctrl.makeRoundedRectangle(260, 598, 300, 30, 5);
    text21_rect.fill = "transparent";
    text21_rect.noStroke();

    text22_rect = two_ctrl.makeRoundedRectangle(250, 563, 105, 30, 15);
    text22_rect.fill = "#BBBBBB";
    text22_rect.noStroke();
    text22 = two_ctrl.makeText("URL Copied!", 250, 565, {size: 15, family: "Lato"});
    text22.fill = "#000000";
    text22_rect.visible = false;
    text22.visible = false;

    two_ctrl.update();

    var buttonsTexts = ["text1", "text2", "text4", "text5", "text8",
        "text10", "text12", "text14", "text16", "text17", "text18", "text20"];
    buttonsTexts.forEach(function(text, index) {
        let rect = eval(text+"_rect");
        $(eval(text)._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                if (text == "text1" || text == "text18" || text == "text20") {
                    rect.linewidth = 1;
                } else {
                    rect.noStroke();
                }
            })
            .click(function(e) {
                switch (text) {
                    case "text1":
                        renderScene();
                        text19.value = "";
                        console.log("Clearing!");
                        break;
                    case "text2":
                        console.log("Resetting!");
                        window.location.search = "";
                        break;
                    case "text4":
                        gridType = "Cartesian";
                        text4_rect.fill = '#0366d6';
                        text5_rect.fill = '#FFFFFF';
                        text4.fill = "#FFFFFF";
                        text5.fill = "#000000";
                        grid_x = 6;
                        grid_y = 6;
                        text9.value = grid_x;
                        text13.value = grid_y;
                        renderScene();
                        console.log("Grid type set to Cartesian");
                        break;
                    case "text5":
                        gridType = "Hexagonal";
                        text5_rect.fill = '#0366d6';
                        text4_rect.fill = '#FFFFFF';
                        text5.fill = "#FFFFFF";
                        text4.fill = "#000000";
                        grid_x = 7;
                        grid_y = 7;
                        text9.value = grid_x;
                        text13.value = grid_y;
                        renderScene();
                        console.log("Grid type set to Hexagonal");
                        break;
                    case "text6":
                        break;
                    case "text8":
                        if (gridType == "Cartesian") {
                            grid_x = (grid_x > 1) ? grid_x-1: grid_x;
                        } else {
                            grid_x = (grid_x > 2) ? grid_x-2: grid_x;
                        }
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text10":
                        if (gridType == "Cartesian") {
                            grid_x = (grid_x < 11) ? grid_x+1: grid_x;
                        } else {
                            max_row = Math.min(10, grid_y*2 - 1);
                            grid_x = (grid_x < max_row) ? grid_x+2: grid_x;
                        }
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text12":
                        if (gridType == "Cartesian") {
                            grid_y = (grid_y > 1) ? grid_y-1: grid_y;
                        } else {
                            min_col = (grid_x+1) / 2;
                            grid_y = (grid_y > min_col) ? grid_y-1: grid_y;
                        }
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text14":
                        grid_y = (grid_y < 11) ? grid_y+1: grid_y;
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text16":
                        distanceType = "Euclidean";
                        text16_rect.fill = '#0366d6';
                        text17_rect.fill = '#FFFFFF';
                        text16.fill = "#FFFFFF";
                        text17.fill = "#000000";
                        blockCells();
                        console.log("Distance type set to Euclidean");
                        break;
                    case "text17":
                        distanceType = "Manhattan";
                        text16_rect.fill = '#FFFFFF';
                        text17_rect.fill = '#0366d6';
                        text16.fill = "#000000";
                        text17.fill = "#FFFFFF";
                        blockCells();
                        console.log("Distance type set to Manhattan");
                        break;
                    case "text18":
                        if (validateSelection()) {
                            text19.value = "Correct!";
                            text19.fill = "green";
                        } else {
                            text19.value = "Conflict!";
                            text19.fill = "red";
                        }
                        window.setTimeout(function(e) {
                            text19.value = "";
                        }, 2000)
                        break;
                    case "text20":
                        text21.value = window.location.href.replace(/\?.*$/,'') + "?" + getURL();
                        window.setTimeout(function(e) {
                            text21._renderer.elem.selectSubString(0, this.length-1);
                            document.execCommand("Copy");
                        }, 100)
                        text22_rect.visible = true;
                        text22.visible = true;
                        window.setTimeout(function(e) {
                            text22_rect.visible = false;
                            text22.visible = false;
                        }, 1500)
                        break;
                }
            })
        $(rect._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                if (text == "text1" || text == "text18" || text == "text20") {
                    rect.linewidth = 1;
                } else {
                    rect.noStroke();
                }
            })
            .click(function(e) {
                switch (text) {
                    case "text1":
                        renderScene();
                        text19.value = "";
                        console.log("Clearing!");
                        break;
                    case "text2":
                        console.log("Resetting!");
                        window.location.search = "";
                        break;
                    case "text4":
                        gridType = "Cartesian";
                        text4_rect.fill = '#0366d6';
                        text5_rect.fill = '#FFFFFF';
                        text4.fill = "#FFFFFF";
                        text5.fill = "#000000";
                        grid_x = 6;
                        grid_y = 6;
                        text9.value = grid_x;
                        text13.value = grid_y;
                        renderScene();
                        console.log("Grid type set to Cartesian");
                        break;
                    case "text5":
                        gridType = "Hexagonal";
                        text5_rect.fill = '#0366d6';
                        text4_rect.fill = '#FFFFFF';
                        text5.fill = "#FFFFFF";
                        text4.fill = "#000000";
                        grid_x = 7;
                        grid_y = 7;
                        text9.value = grid_x;
                        text13.value = grid_y;
                        renderScene();
                        console.log("Grid type set to Hexagonal");
                        break;
                    case "text6":
                        break;
                    case "text8":
                        if (gridType == "Cartesian") {
                            grid_x = (grid_x > 1) ? grid_x-1: grid_x;
                        } else {
                            grid_x = (grid_x > 2) ? grid_x-2: grid_x;
                        }
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text10":
                        if (gridType == "Cartesian") {
                            grid_x = (grid_x < 11) ? grid_x+1: grid_x;
                        } else {
                            max_row = Math.min(10, grid_y*2 - 1);
                            grid_x = (grid_x < max_row) ? grid_x+2: grid_x;
                        }
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text12":
                        if (gridType == "Cartesian") {
                            grid_y = (grid_y > 1) ? grid_y-1: grid_y;
                        } else {
                            min_col = (grid_x+1) / 2;
                            grid_y = (grid_y > min_col) ? grid_y-1: grid_y;
                        }
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text14":
                        grid_y = (grid_y < 11) ? grid_y+1: grid_y;
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text16":
                        distanceType = "Euclidean";
                        text16_rect.fill = '#0366d6';
                        text17_rect.fill = '#FFFFFF';
                        text16.fill = "#FFFFFF";
                        text17.fill = "#000000";
                        blockCells();
                        console.log("Distance type set to Euclidean");
                        break;
                    case "text17":
                        distanceType = "Manhattan";
                        text16_rect.fill = '#FFFFFF';
                        text17_rect.fill = '#0366d6';
                        text16.fill = "#000000";
                        text17.fill = "#FFFFFF";
                        blockCells();
                        console.log("Distance type set to Manhattan");
                        break;
                    case "text18":
                        if (validateSelection()) {
                            text19.value = "Correct!";
                            text19.fill = "green";
                        } else {
                            text19.value = "Conflict!";
                            text19.fill = "red";
                        }
                        window.setTimeout(function(e) {
                            text19.value = "";
                        }, 2000)
                        break;
                    case "text20":
                        text21.value = window.location.href.replace(/\?.*$/,'') + "?" + getURL();
                        window.setTimeout(function(e) {
                            text21._renderer.elem.selectSubString(0, this.length-1);
                            document.execCommand("Copy");
                        }, 100)
                        text22_rect.visible = true;
                        text22.visible = true;
                        window.setTimeout(function(e) {
                            text22_rect.visible = false;
                            text22.visible = false;
                        }, 1500)
                        break;
                }
            })
    })
}

if (window.location.search) {
    setURL();
} else {
    renderScene();
    renderControls();
}

two.play();
two_ctrl.play();
