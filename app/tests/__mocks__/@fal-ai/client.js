const subscribe = jest.fn(async () => ({
  data: {
    images: [
      {
        url: 'https://example.com/mock-image.png',
        width: 1024,
        height: 768,
        content_type: 'image/png',
      },
    ],
  },
}));

const config = jest.fn();

const fal = {
  config,
  subscribe,
};

module.exports = { fal };
module.exports.default = { fal };

