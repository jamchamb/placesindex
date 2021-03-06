var lunr = require('./lunr');
var kdtree = require('./kdtree');

function toRad (x) { return x * Math.PI / 180; }

function haversine (s, t) {
  var lon1 = s.x;
  var lon2 = t.x;

  var lat1 = s.y;
  var lat2 = t.y;

  var dLat = (lat2-lat1);
  var dLon = (lon2-lon1);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
}

// ## index
// Indexes the building data in `data` and returns an object with list of all
// buildings, serialized lunr store, and serialized kdtree
function index (data) {
  var idx = lunr(function () {
    this.field('title');
    //this.field('descr');
    this.ref('id');
    this.field('code');
    this.field('depts');
  });

  var identifier;
  var points = [];
  var all = {};
  data.forEach(function (building) {
    // Use building number + id as unique identifier
    identifier = building.building_number + "_" + building.building_id + building.title;

    var doc = {
      title: building.title,
      num: building.building_number,
      descr: building.description,
      code: building.building_code,
      depts: building.offices? building.offices.join(', ') : '',
      id: identifier
    };
    idx.add(doc);

    if (building.location && building.location.longitude) {
      var point = {
        x: toRad(Number(building.location.longitude)),
        y: toRad(Number(building.location.latitude)),
        title: building.title,
        num: building.building_number,
        id: identifier
      };
      points.push(point);
    }

    building.id = identifier;

    all[identifier] = building;
  });

  var tree = new kdTree(points, haversine, ['x', 'y']);

  return {lunr: idx.toJSON(), kdtree: tree.toJSON(), all: all};
}

module.exports = index;
