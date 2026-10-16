const params = new URLSearchParams(window.location.search);

// The trial flag only controls isolated storage and accelerated mechanics.
// The approved v005 visual language is now the production default.
export const isPlaytest = params.get('trial') === 'play';
export const useV005Design = params.get('design') !== 'legacy';
