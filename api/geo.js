'use strict';

const pi4 = Math.PI/4;

const radToDeg = (180 / Math.PI);

// pt = [long, lat] (GeoJSON Point).coordinates
function getBearing(pta, ptb){
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