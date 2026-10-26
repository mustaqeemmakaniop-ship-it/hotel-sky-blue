/**
 * Hotel Sky Blue - Clean, Lightweight JavaScript
 * Powered by standard Bootstrap 5 components
 */

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1.0 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  AED: { symbol: 'AED ', rate: 0.044 }
};

let activeCurrency = 'INR';

document.addEventListener('DOMContentLoaded', () => {
  setupDefaultDates();
  calculateBookingPrice();
  setupMobileNavAutoClose();
});

// Auto-close mobile navbar when a link is clicked
function setupMobileNavAutoClose() {
  const navCollapse = document.getElementById('navbarNav');
  if (!navCollapse) return;
  const navItems = navCollapse.querySelectorAll('.nav-link, .btn');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse);
        bsCollapse.hide();
      }
    });
  });
}

// Setup default check-in and check-out dates
function setupDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkout = new Date(tomorrow);
  checkout.setDate(checkout.getDate() + 2);

  const toDateInputString = (d) => d.toISOString().split('T')[0];

  const inStr = toDateInputString(tomorrow);
  const outStr = toDateInputString(checkout);

  ['quickCheckin', 'modalCheckin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = inStr; el.min = toDateInputString(today); }
  });

  ['quickCheckout', 'modalCheckout'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = outStr; el.min = inStr; }
  });
}

// Currency Switcher
function changeCurrency(currCode) {
  if (!CURRENCIES[currCode]) return;
  activeCurrency = currCode;
  const { symbol, rate } = CURRENCIES[currCode];

  // Update room cards
  document.querySelectorAll('.room-card-price[data-price]').forEach(el => {
    const baseInr = parseFloat(el.getAttribute('data-price'));
    const converted = Math.round(baseInr * rate);
    el.innerHTML = `${symbol}${converted.toLocaleString('en-IN')} <span class="fs-6 text-muted fw-normal">/ night</span>`;
  });

  calculateBookingPrice();
}

function formatPrice(inrAmount) {
  const { symbol, rate } = CURRENCIES[activeCurrency] || CURRENCIES.INR;
  const val = Math.round(inrAmount * rate);
  return `${symbol}${val.toLocaleString('en-IN')}`;
}

// Calculate Price for Booking
function calculateBookingPrice() {
  const inVal = document.getElementById('modalCheckin')?.value;
  const outVal = document.getElementById('modalCheckout')?.value;
  const roomSelect = document.getElementById('modalRoom');

  if (!roomSelect) return;

  const selectedOption = roomSelect.options[roomSelect.selectedIndex];
  const roomPriceINR = parseFloat(selectedOption?.value || 2000);
  const roomName = selectedOption?.getAttribute('data-name') || 'Standard Double';

  let nights = 1;
  if (inVal && outVal) {
    const dIn = new Date(inVal);
    const dOut = new Date(outVal);
    const diff = Math.ceil((dOut - dIn) / (1000 * 60 * 60 * 24));
    if (diff > 0) nights = diff;
  }

  const grandTotal = roomPriceINR * nights;

  // Update modal summary elements
  const labelEl = document.getElementById('modalRoomLabel');
  const roomCostEl = document.getElementById('modalRoomCost');
  const totalCostEl = document.getElementById('modalTotalCost');

  if (labelEl) labelEl.innerText = `${roomName} (${nights} night${nights > 1 ? 's' : ''})`;
  if (roomCostEl) roomCostEl.innerText = formatPrice(grandTotal);
  if (totalCostEl) totalCostEl.innerText = formatPrice(grandTotal);

  return { nights, roomName, grandTotal };
}

// Open booking modal pre-selecting a room from the card
function openBookingWithRoom(roomValue) {
  const select = document.getElementById('modalRoom');
  if (select) {
    select.value = roomValue;
  }
  calculateBookingPrice();
  const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
  modal.show();
}

// Sync from Quick Bar on Hero
function syncQuickBarAndOpen() {
  const qIn = document.getElementById('quickCheckin')?.value;
  const qOut = document.getElementById('quickCheckout')?.value;
  const qRoom = document.getElementById('quickRoom')?.value;
  const qGuests = document.getElementById('quickGuests')?.value;

  if (qIn) document.getElementById('modalCheckin').value = qIn;
  if (qOut) document.getElementById('modalCheckout').value = qOut;
  if (qRoom) document.getElementById('modalRoom').value = qRoom;
  if (qGuests) document.getElementById('modalGuests').value = qGuests;

  calculateBookingPrice();
  const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
  modal.show();
}

// Format dates to human-friendly format (e.g. 25 Oct 2026)
function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return dateStr;
}

// Format clean, simple, and easy-to-read voucher for Hotel WhatsApp
function formatVoucherMessage(res) {
  const inDate = formatHumanDate(res.checkIn);
  const outDate = formatHumanDate(res.checkOut);

  return (
    `🏨 *Hotel Sky Blue, Surat* — New Room Booking Request\n` +
    `-----------------------------------------\n` +
    `📋 *Booking Ref:* #${res.ref}\n` +
    `👤 *Guest Name:* ${res.guestName}\n` +
    (res.guestPhone ? `📞 *Customer Phone:* ${res.guestPhone}\n` : '') +
    `🛏️ *Room Type:* ${res.roomName}\n` +
    `👥 *Guests:* ${res.guests || '2'} Person(s)\n` +
    `📅 *Check-In:* ${inDate} (From 12:00 PM)\n` +
    `📅 *Check-Out:* ${outDate} (Until 11:30 AM)\n` +
    `🌙 *Total Stay:* ${res.nights} Night${res.nights > 1 ? 's' : ''}\n` +
    `💰 *Total Amount:* ${res.total}\n` +
    `💳 *Payment:* Pay at Hotel (Cash / UPI)\n` +
    `-----------------------------------------\n` +
    `⚠️ *Hotel Policy:* Unmarried couples are strictly not allowed. Valid Govt Photo ID required at check-in.\n` +
    `-----------------------------------------\n` +
    `📍 *Hotel Address:*\n` +
    `4th Floor, Scarlet Mall, Anand Mahal Road,\n` +
    `Adajan, Surat, Gujarat - 395009\n` +
    `-----------------------------------------\n` +
    `Hello Hotel Sky Blue, please confirm my room booking. Thank you!`
  );
}

// Handle Booking Form Submission - Direct WhatsApp Booking & Voucher
function handleBookingSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('modalName')?.value.trim() || 'Guest';
  const rawPhone = document.getElementById('modalPhone')?.value.trim() || '';
  const inVal = document.getElementById('modalCheckin')?.value;
  const outVal = document.getElementById('modalCheckout')?.value;
  const guests = document.getElementById('modalGuests')?.value || '2';

  // Sanitize phone number (remove non-digits)
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    cleanPhone = cleanPhone.slice(2);
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.slice(1);
  }

  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : rawPhone;

  if (!inVal || !outVal) {
    alert('Please select Check-In and Check-Out dates.');
    return;
  }

  if (new Date(outVal) <= new Date(inVal)) {
    alert('Check-out date must be after check-in date.');
    return;
  }

  const p = calculateBookingPrice();
  const bookingRef = 'SB-' + Math.floor(100000 + Math.random() * 900000);

  const reservation = {
    ref: bookingRef,
    guestName: name,
    guestPhone: formattedPhone,
    cleanPhone: cleanPhone,
    guests: guests,
    roomName: p.roomName,
    checkIn: inVal,
    checkOut: outVal,
    nights: p.nights,
    total: formatPrice(p.grandTotal),
    bookingDate: new Date().toLocaleDateString()
  };

  // Build official voucher message for WhatsApp
  const voucherMsg = formatVoucherMessage(reservation);
  const waHotelUrl = `https://wa.me/919824121554?text=${encodeURIComponent(voucherMsg)}`;

  // Save to localStorage
  try {
    const list = JSON.parse(localStorage.getItem('sky_blue_bookings') || '[]');
    list.unshift(reservation);
    localStorage.setItem('sky_blue_bookings', JSON.stringify(list));
  } catch (err) {
    console.error('Storage error:', err);
  }

  // Populate voucher view
  if (document.getElementById('voucherRef')) document.getElementById('voucherRef').innerText = '#' + reservation.ref;
  if (document.getElementById('voucherName')) document.getElementById('voucherName').innerText = reservation.guestName;
  if (document.getElementById('voucherPhone')) document.getElementById('voucherPhone').innerText = formattedPhone || 'N/A';
  if (document.getElementById('voucherRoom')) document.getElementById('voucherRoom').innerText = reservation.roomName;
  if (document.getElementById('voucherGuests')) document.getElementById('voucherGuests').innerText = `${reservation.guests || '2'} Person(s)`;
  if (document.getElementById('voucherCheckin')) document.getElementById('voucherCheckin').innerText = formatHumanDate(reservation.checkIn);
  if (document.getElementById('voucherCheckout')) document.getElementById('voucherCheckout').innerText = formatHumanDate(reservation.checkOut);
  if (document.getElementById('voucherTotal')) document.getElementById('voucherTotal').innerText = reservation.total;

  const fallbackLink = document.getElementById('waDirectFallback');
  if (fallbackLink) {
    fallbackLink.href = waHotelUrl;
  }

  // Toggle views inside modal
  document.getElementById('bookingFormPane').style.display = 'none';
  document.getElementById('bookingSuccessPane').style.display = 'block';

  // Automatically open WhatsApp with Hotel Sky Blue (+91 98241 21554) containing the complete voucher!
  window.open(waHotelUrl, '_blank');
}

// Reset booking form when modal closes
document.addEventListener('hidden.bs.modal', function(event) {
  if (event.target.id === 'bookingModal') {
    document.getElementById('bookingFormPane').style.display = 'block';
    document.getElementById('bookingSuccessPane').style.display = 'none';
  }
});

// Search Booking from Storage
function handleSearchBooking(event) {
  event.preventDefault();
  const query = document.getElementById('searchQuery')?.value.trim().toUpperCase();
  const resultsDiv = document.getElementById('searchResults');
  if (!query || !resultsDiv) return;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('sky_blue_bookings') || '[]');
  } catch (e) {
    list = [];
  }

  const matches = list.filter(b => 
    b.ref.toUpperCase().includes(query) || 
    (b.guestPhone && b.guestPhone.includes(query)) ||
    (b.guestName && b.guestName.toUpperCase().includes(query))
  );

  if (matches.length === 0) {
    resultsDiv.innerHTML = `
      <div class="alert alert-secondary text-center my-3">
        No booking found matching "${query}". Please check your Reference or Email.
      </div>
    `;
    return;
  }

  resultsDiv.innerHTML = matches.map(b => `
    <div class="card mb-3 border shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold font-monospace text-primary fs-5">#${b.ref}</span>
          <span class="badge bg-primary">Confirmed</span>
        </div>
        <h6 class="card-title fw-bold mb-1">${b.roomName}</h6>
        <p class="text-muted small mb-2">Dates: ${b.checkIn} to ${b.checkOut} (${b.nights} nights)</p>
        <div class="d-flex justify-content-between pt-2 border-top small mb-3">
          <span>Guest: <strong>${b.guestName}</strong></span>
          <span class="fw-bold text-primary">${b.total}</span>
        </div>
        <div class="d-grid gap-2">
          ${b.cleanPhone && b.cleanPhone.length === 10 ? `
            <a href="https://wa.me/91${b.cleanPhone}?text=${encodeURIComponent(formatVoucherMessage(b))}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm fw-semibold d-flex align-items-center justify-content-center gap-1">
              <i class="fa-brands fa-whatsapp fs-6 text-primary"></i>
              <span>Send Voucher to Customer (+91 ${b.cleanPhone})</span>
            </a>
          ` : ''}
          <a href="https://wa.me/919824121554?text=${encodeURIComponent(formatVoucherMessage(b))}" target="_blank" rel="noopener" class="btn btn-primary btn-sm fw-semibold d-flex align-items-center justify-content-center gap-1">
            <i class="fa-solid fa-hotel fs-6"></i>
            <span>Send to Hotel Sky Blue Desk</span>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}
