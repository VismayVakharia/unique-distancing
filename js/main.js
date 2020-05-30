var elem = document.getElementById('draw');
var params = { type: Two.Types.svg, fullscreen: false, width: 700, height: 700 };
var two = new Two(params).appendTo(elem);

var params_ctrl = { type: Two.Types.svg, fullscreen: false, width: 400, height: 700 };
var two_ctrl = new Two(params_ctrl).appendTo(document.getElementById('draw'));

var grid_x = 6;  // number of rows
var grid_y = 6;  // number of columns

var distanceType = "Euclidean";

var offset = 0;

function indicesFromID(id_) {
    let id = parseInt(id_.slice(4)) - offset;
    let quotient = Math.floor(id/grid_y);
    let remainder = id % grid_y;
    let x = (remainder != 0) ? quotient : quotient-1;
    let y = (remainder != 0) ? remainder-1 : grid_y-1;
    return [x ,y];
}

function distance(id1, id2, disType) {
    let x1, y1, x2, y2;
    [x1, y1] = indicesFromID(id1);
    [x2, y2] = indicesFromID(id2);
    if (disType == "Euclidean") {
        return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
    } else if (disType == "Manhattan") {
        return Math.abs(x1-x2) + Math.abs(y1-y2);
    } else {
        return NaN;
    }
}

function getDistNeighbors(id_, dist) {
    let x, y;
    [x, y] = indicesFromID(id);
    var array = Array();
    for (let i=0; i<grid_x; i++) {
        for (let j=0; j<grid_y; j++) {
            let curr_id = (i+1)*grid_y + j;
            if (Math.abs(distance(id_, "two-"+curr_id, distanceType) - dist) < 1e-8) {
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
            let dist = distance(cell1.id, cell2.id, distanceType);
            if (!distances.includes(dist) && dist != 0) {
                distances.push(dist);
            }
        })
    })
}

function blockCells(flagHover=false) {
    updateDistances();
    blockedCells.splice(0, blockedCells.length);
    for (let i=0; i<grid_x; i++) {
        for (let j=0; j<grid_y; j++) {
            symmetry_dists = Array();
            let circ = circArray[i*grid_y+j];
            if (flagHover) {
                if (circ.fill == "#999999") {
                    circ.fill = 'rgba(200, 200, 255, 0.2)';
                }
            } else {
                if (circ.fill == "#000000" || circ.fill == "#999999") {
                    circ.fill = 'rgba(200, 200, 255, 0.2)';
                }
            }
            selection.forEach(function(cell, index) {
                let curr_dist;
                curr_dist = distance(cell.id, circ.id, distanceType);
                if (distances.includes(curr_dist) || symmetry_dists.includes(curr_dist)) {
                    if (circ.fill == 'rgba(200, 200, 255, 0.2)') {
                        if (!flagHover) {
                            circ.fill = "#000000";
                        }
                        blockedCells.push(circ);
                    }
                }
                symmetry_dists.push(curr_dist);
            })
        }
    }
    return blockedCells;
}

function validateSelection() {
    let l = selection.length;
    let dists = Array();
    for (let i=0; i < l; i++) {
        for (let j=i+1; j < l; j++) {
            let dist = distance(selection[i].id, selection[j].id, distanceType);
            if (dists.includes(dist)) {
                console.log("Conflict", selection[i], selection[j]);
                return false;
            } else {
                dists.push(dist);
            }
        }
    }
    return true;
}

var styles = {
  alignment: "center",
  size: 20,
  family: "Lato"
};

var text16_rect, text17_rect, text1_rect, text2_rect;
var text15, text16, text17, text1, text2;
var circArray = Array();
var selection = Array();
var distances = Array();
var blockedCells = Array();

function renderScene() {
    two.clear();

    var spacing_x = Math.floor(two.width/(grid_y + 1));
    var spacing_y = Math.floor(two.height/(grid_x + 1));
    var spacing = Math.min(spacing_x, spacing_y);
    var x_offset = two.width/2 - spacing_x * (grid_y-1)/2;
    var y_offset = two.height/2 - spacing_y * (grid_x-1)/2;
    var radius = Math.floor(Math.min(spacing_x, spacing_y) * 0.4);

    circArray.splice(0, circArray.length);
    selection.splice(0, selection.length);
    distances.splice(0, distances.length);

    for (let i=0; i<grid_x; i++){
        for (let j=0; j<grid_y; j++){
            let x = x_offset + spacing * j;
            let y = y_offset + spacing * i;
            circArray.push(two.makeCircle(x, y, radius));
            let circ = circArray.slice(-1)[0];
            circ.fill = 'rgba(200, 200, 255, 0.2)';
            circ.linewidth = 1;
            circ.stroke = '#1C75BC';
        }
    }

    offset = parseInt(circArray[0].id.slice(4)) - 1;
    console.log("offset", offset);

    two.update();

    circArray.forEach(function(circ, index){
        // two.bind('update', function(frameCount, timeDelta) {
        //     circ.rotation = frameCount / 60;
        //   });
        $(circ._renderer.elem)
           .css('cursor', 'pointer')
           .hover(function(e) {
               circ.linewidth = 2;
               circ.stroke = "#000000";
               if (circ.fill == 'rgba(200, 200, 255, 0.2)') {
                   circ.fill = "#FFE86E";
                   selection.push(circ);
                   let cells = blockCells(true);
                   cells.forEach(function(cell, index) {
                       if (cell.fill != "#000000") {
                           cell.fill = "#999999";
                       }
                   })
               } else if (circ.fill == "#FFD700") {
                   circ.fill = 'rgba(200, 200, 255, 0.5)';
                   let index = selection.indexOf(circ);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
                   selection.push(circ);
                   let cells = blockCells(true);
                   cells.forEach(function(cell, index) {
                       if (cell.fill != "#000000") {
                           cell.fill = "#999999";
                       }
                   })
               }
           }, function(e) {
               circ.linewidth = 1;
               circ.stroke = "#1C75BC";
               if (circ.fill == "#FFE86E") {
                   circ.fill = 'rgba(200, 200, 255, 0.2)';
                   let index = selection.indexOf(circ);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
               } else if (circ.fill == 'rgba(200, 200, 255, 0.5)') {
                   circ.fill = "#FFD700";
                   blockCells();
               }
           })
           .click(function(e) {
               if (circ.fill == "#FFE86E") {
                   circ.fill = "#FFD700";
                   // selection.push(circ);
                   blockCells();
                   console.log(circ.id, "selected");
               }
               else if (circ.fill == 'rgba(200, 200, 255, 0.5)') {
                   circ.fill = 'rgba(200, 200, 255, 0.2)';
                   let index = selection.indexOf(circ);
                   if (index !== -1) selection.splice(index, 1);
                   blockCells();
                   console.log(circ.id, "deselected");
               }
               // two.update();
           });
    })

    blockCells();
}

function renderControls() {

    text1_rect = two_ctrl.makeRoundedRectangle(50, 18, 95, 30, 5);
    text2_rect = two_ctrl.makeRoundedRectangle(300, 18, 95, 30, 5);
    text1_rect.fill = '#FFFFFF';
    text2_rect.fill = '#FF0000';

    text1 = two_ctrl.makeText("Clear", 50, 20, styles);
    text2 = two_ctrl.makeText("Reset", 300, 20, styles);
    text2.weight = 800;
    text1.fill = "#000000";
    text2.fill = "#FFFFFF";


    text4_rect = two_ctrl.makeRoundedRectangle(95, 98, 70, 30, 5);
    text5_rect = two_ctrl.makeRoundedRectangle(185, 98, 90, 30, 5);
    text6_rect = two_ctrl.makeRoundedRectangle(295, 98, 110, 30, 5);
    text4_rect.fill = '#0366d6';
    text5_rect.fill = "#FFFFFF";
    text6_rect.fill = "#FFFFFF";
    text4_rect.noStroke();
    text5_rect.noStroke();
    text6_rect.noStroke();

    text3 = two_ctrl.makeText("Style: ", 24, 100, styles);
    text4 = two_ctrl.makeText("Circle", 95, 100, styles);
    text5 = two_ctrl.makeText("Triangle", 185, 100, styles);
    text6 = two_ctrl.makeText("Hexagonal", 295, 100, styles);
    text4.fill = "#FFFFFF";
    text5.fill = "#000000";
    text6.fill = "#000000";


    text8_rect = two_ctrl.makeRoundedRectangle(140, 148, 40, 30, 5);
    text9_rect = two_ctrl.makeRoundedRectangle(200, 148, 50, 30, 5);
    text10_rect = two_ctrl.makeRoundedRectangle(260, 148, 40, 30, 5);
    text8_rect.fill = "#FFFFFF";
    text9_rect.fill = "#0366d6";
    text10_rect.fill = "#FFFFFF";
    text8_rect.noStroke();
    text9_rect.noStroke();
    text10_rect.noStroke();

    text7 = two_ctrl.makeText("No. of Rows: ", 55, 150, styles);
    text8 = two_ctrl.makeText("<", 140, 150, styles);
    text9 = two_ctrl.makeText("6", 200, 150, styles);
    text10 = two_ctrl.makeText(">", 260, 150, styles);
    text8.fill = "#000000";
    text9.fill = "#FFFFFF";
    text10.fill = "#000000";


    text12_rect = two_ctrl.makeRoundedRectangle(140, 198, 40, 30, 5);
    text13_rect = two_ctrl.makeRoundedRectangle(200, 198, 50, 30, 5);
    text14_rect = two_ctrl.makeRoundedRectangle(260, 198, 40, 30, 5);
    text12_rect.fill = "#FFFFFF";
    text13_rect.fill = "#0366d6";
    text14_rect.fill = "#FFFFFF";
    text12_rect.noStroke();
    text13_rect.noStroke();
    text14_rect.noStroke();

    text11 = two_ctrl.makeText("No. of Cols: ", 50, 200, styles);
    text12 = two_ctrl.makeText("<", 140, 200, styles);
    text13 = two_ctrl.makeText("6", 200, 200, styles);
    text14 = two_ctrl.makeText(">", 260, 200, styles);
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


    text18_rect = two_ctrl.makeRoundedRectangle(50, 598, 95, 30, 5);
    // text19_rect = two_ctrl.makeRoundedRectangle(160, 598, 105, 30, 5);
    text18_rect.fill = "#04BF23";
    // text19_rect.fill = "#FFFFFF";
    text18_rect.noStroke();
    // text19_rect.noStroke();

    text18 = two_ctrl.makeText("Validate?", 50, 600, styles);
    text19 = two_ctrl.makeText("", 160, 600, styles);
    text18.fill = "#000000";
    text19.fill = "#000000";
    text19.weight = 800;

    two_ctrl.update();

    var buttonsTexts = ["text1", "text2", "text8", "text10", "text12",
        "text14", "text16", "text17", "text18"];
    // var buttonsTexts = ["text1", "text2", "text4", "text5", "text6", "text8",
    //     "text10", "text12", "text14", "text16", "text17", "text18"];
    buttonsTexts.forEach(function(text, index) {
        let rect = eval(text+"_rect");
        $(eval(text)._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                if (text == "text1") {
                    rect.linewidth = 1;
                // } else if (text == "text18") {
                //     text19.value = "";
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
                        location.reload();
                        break;
                    case "text4":
                        break;
                    case "text5":
                        break;
                    case "text6":
                        break;
                    case "text8":
                        grid_x = (grid_x > 2) ? grid_x-1: grid_x;
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text10":
                        grid_x = (grid_x < 10) ? grid_x+1: grid_x;
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text12":
                        grid_y = (grid_y > 2) ? grid_y-1: grid_y;
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text14":
                        grid_y = (grid_y < 10) ? grid_y+1: grid_y;
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
                }
            })
        $(rect._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                if (text == "text1") {
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
                        location.reload();
                        break;
                    case "text4":
                        break;
                    case "text5":
                        break;
                    case "text6":
                        break;
                    case "text8":
                        grid_x = (grid_x > 2) ? grid_x-1: grid_x;
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text10":
                        grid_x = (grid_x < 10) ? grid_x+1: grid_x;
                        text9.value = grid_x;
                        renderScene();
                        break;
                    case "text12":
                        grid_y = (grid_y > 2) ? grid_y-1: grid_y;
                        text13.value = grid_y;
                        renderScene();
                        break;
                    case "text14":
                        grid_y = (grid_y < 10) ? grid_y+1: grid_y;
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
                }
            })
    })
}

renderScene();
renderControls();

two.play();
two_ctrl.play();
