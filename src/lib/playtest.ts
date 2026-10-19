const params = new URLSearchParams(window.location.search);

// The trial flag only controls isolated storage and accelerated mechanics.
// The approved v005 visual language is the only production design. Keeping a
// query-string escape hatch here allowed an old Telegram link to silently
// switch the application back to the legacy board.
export const isPlaytest = params.get('trial') === 'play';
export const useV005Design = true;
