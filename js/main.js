var elem = document.getElementById('draw');
var params = { type: Two.Types.svg, fullscreen: false, width: 700, height: 700 };
var two = new Two(params).appendTo(elem);

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

var styles = {
  alignment: "center",
  size: 20,
  family: "Lato"
};

$("input#rows.slider").click(function() {
    grid_x = parseInt(this.value);
    $("input#n_rows.show").val(grid_x);
    renderScene();
})
$("input#cols.slider").click(function() {
    grid_y = parseInt(this.value);
    $("input#n_cols.show").val(grid_y);
    renderScene();
})

var text2_rect, text3_rect, text4_rect, text5_rect;
var text1, text2, text3, text4, text5;
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

    text2_rect = two.makeRoundedRectangle(140, 18, 95, 30, 5)
    text3_rect = two.makeRoundedRectangle(250, 18, 105, 30, 5)
    text4_rect = two.makeRoundedRectangle(500, 18, 95, 30, 5)
    text5_rect = two.makeRoundedRectangle(600, 18, 95, 30, 5)
    text2_rect.fill = (distanceType == "Euclidean") ? '#0366d6' : "#FFFFFF";
    text3_rect.fill = (distanceType == "Euclidean") ? '#FFFFFF' : "#0366d6";
    text4_rect.fill = '#FFFFFF';
    text5_rect.fill = '#FF0000';
    text2_rect.noStroke();
    text3_rect.noStroke();

    text1 = two.makeText("Distance: ", 40, 20, styles);
    text2 = two.makeText("Euclidean", 140, 20, styles);
    text3 = two.makeText("Manhattan", 250, 20, styles);
    text4 = two.makeText("Clear", 500, 20, styles);
    text5 = two.makeText("Reset", 600, 20, styles);
    text5.weight = 800;
    text2.fill = (distanceType == "Euclidean") ? "#FFFFFF" : "#000000";
    text3.fill = (distanceType == "Euclidean") ? "#000000" : "#FFFFFF";
    text4.fill = "#000000";
    text5.fill = "#FFFFFF";

    var buttonsTexts = ["text2", "text3", "text4", "text5"];
    var buttonsRects = [text2_rect, text3_rect, text4_rect, text5_rect];

    offset = parseInt(circArray[0].id.slice(4)) - 1;
    console.log("offset", offset);

    two.update();

    buttonsTexts.forEach(function(text, index) {
        let rect = eval(text+"_rect");
        $(eval(text)._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                rect.linewidth = 1;
                rect.stroke = (text.slice(4)<4) ? "#FFFFFF" : "#000000";
            })
        $(rect._renderer.elem)
            .css('cursor', 'pointer')
            .hover(function(e) {
                rect.linewidth = 2;
                rect.stroke = "#000000";
            }, function(e) {
                rect.linewidth = 1;
                rect.stroke = (text.slice(4)<4) ? "#FFFFFF" : "#000000";
            })
    })
    $(text2_rect._renderer.elem)
        .click(function(e) {
            distanceType = "Euclidean";
            text2_rect.fill = '#0366d6';
            text3_rect.fill = '#FFFFFF';
            text2.fill = "#FFFFFF";
            text3.fill = "#000000";
            blockCells();
            console.log("Distance type set to Euclidean");
        })
    $(text2._renderer.elem)
        .click(function(e) {
            distanceType = "Euclidean";
            text2_rect.fill = '#0366d6';
            text3_rect.fill = '#FFFFFF';
            text2.fill = "#FFFFFF";
            text3.fill = "#000000";
            blockCells();
            console.log("Distance type set to Euclidean");
        })
    $(text3._renderer.elem)
        .click(function(e) {
            distanceType = "Manhattan";
            text2_rect.fill = '#FFFFFF';
            text3_rect.fill = '#0366d6';
            text2.fill = "#000000";
            text3.fill = "#FFFFFF";
            blockCells();
            console.log("Distance type set to Manhattan");
        })
    $(text4._renderer.elem)
        .click(function(e) {
            renderScene()
            console.log("Clearing!");
        })
    $(text4_rect._renderer.elem)
        .click(function(e) {
            renderScene()
            console.log("Clearing!");
        })
    $(text5._renderer.elem)
        .click(function(e) {
            console.log("Resetting!");
            location.reload();
        })
    $(text5_rect._renderer.elem)
        .click(function(e) {
            console.log("Resetting!");
            location.reload();
        })

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

renderScene();

two.play();
