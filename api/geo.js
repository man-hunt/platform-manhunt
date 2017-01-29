'use strict';

const pi4 = Math.PI/4;

const radToDeg = (180 / Math.PI);

function getBearing(pta, ptb){
	let lat1 = pta[1]/radToDeg;
	let lat2 = ptb[1]/radToDeg;
	let lng1 = pta[0]/radToDeg;
	let lng2 = ptb[0]/radToDeg;
	var dLon = lng2-lng1;
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x) * radToDeg;
    return ((brng + 360) % 360);
}

// pt = [long, lat] (GeoJSON Point).coordinates
function getBearingOld(pta, ptb){
	// Δφ = ln( tan( latB / 2 + π / 4 ) / tan( latA / 2 + π / 4) ) 
	// Δlon = abs( lonA - lonB ) 
	// bearing :  θ = atan2( Δlon ,  Δφ ) 
	pta = [pta[0]/radToDeg, pta[1]/radToDeg];
	ptb = [ptb[0]/radToDeg, ptb[1]/radToDeg];
	let dPhi = Math.log( Math.tan(ptb[1]/2 + pi4) /  Math.tan(pta[1]/2 + pi4) );
	let dLong = Math.abs(pta[0] - ptb[0]);
	if(dLong > 180)
		dLong = dLong % 180;
	let bearing = Math.atan2(dLong, dPhi) * radToDeg;
	return (bearing + 360) % 360;
}

module.exports = {
	getBearing
}