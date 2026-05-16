'use strict';

const LAT = 18.651633377724096;
const LNG = -91.83675098241301;

const placeholder = document.getElementById('map-placeholder');
const mapDiv      = document.getElementById('map');

let leafletMap = null;

function refreshMap() {
    if (leafletMap) leafletMap.invalidateSize();
}

if (mapDiv && placeholder) {

    mapDiv.style.display = 'block';
    placeholder.style.display = 'none';

    leafletMap = L.map('map', { scrollWheelZoom: false }).setView([LAT, LNG], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(leafletMap);

    const pinIcon = L.divIcon({
        className: '',
        html: `<img src="img/pin.svg" style="width:auto;height:60px;display:block;">`,
        iconSize:    [48, 60],
        iconAnchor:  [24, 60],   
        popupAnchor:  [5, -60],

    });

  
    const gmapsURL = 'https://www.google.com/maps/dir//18.6516745,-91.836765/@18.6285654,-91.8396296,14z?entry=ttu&g_ep=EgoyMDI2MDMxNy4wIKXMDSoASAFQAw%3D%3D';

    const popupHTML = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;min-width:220px;max-width:260px;color:#1a1a2e;">
        <div style="background:#0a2a4a;color:#fff;padding:10px 14px 8px;border-radius:6px 6px 0 0;margin:-14px -25px 10px -21px;">
            <strong style="font-size:1rem;letter-spacing:.5px;">SERTECSUR</strong><br>
            <span style="font-size:.75rem;opacity:.85;">Seguridad &amp; Tecnología</span>
        </div>
        <div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:9px;">
            <span style="font-size:1rem;color:#0a2a4a;margin-top:1px;"></span>
            <div style="font-size:.82rem;line-height:1.45;">
            Calle 55 #50, Col. Electricistas<br>
            24120 Cd. del Carmen, CAM<br>
            <a href="tel:+529381532506" style="color:#0a2a4a;font-weight:600;text-decoration:none;">938 153 2506</a>
            </div>
        </div>
        <div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:11px;">
            <span style="font-size:1rem;color:#0a2a4a;margin-top:1px;"></span>
            <div style="font-size:.8rem;line-height:1.6;">
            <div style="display:grid;grid-template-columns:auto 1fr;gap:0 8px;">
                <span>Lunes – Viernes</span><span style="color:#2a7a2a;font-weight:600;">09:00 – 19:00</span>
                <span>Sábado</span>         <span style="color:#2a7a2a;font-weight:600;">09:00 – 17:00</span>
                <span>Domingo</span>        <span style="color:#c0392b;font-weight:600;">Cerrado</span>
            </div>
            </div>
        </div>
        <a href="${gmapsURL}" target="_blank" rel="noopener noreferrer"
            style="display:block;background:#0a2a4a;color:#fff;text-align:center;padding:8px 0;border-radius:5px;font-size:.82rem;font-weight:600;text-decoration:none;letter-spacing:.3px;">
            Obtener indicaciones
        </a>
        </div>
    `;

    L.marker([LAT, LNG], { icon: pinIcon })
        .addTo(leafletMap)
        .bindPopup(popupHTML, { maxWidth: 280 });

    const viewEl = mapDiv.closest('.view') || mapDiv.parentElement;

    const observer = new MutationObserver(() => {
        if (mapDiv.offsetWidth > 0 && mapDiv.offsetHeight > 0) {
        leafletMap.invalidateSize();
        }
    });

    observer.observe(viewEl, {
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    setTimeout(() => leafletMap.invalidateSize(), 300);
}