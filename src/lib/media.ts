/**
 * Photography + the image-space coordinates of what each shot is "tracking".
 * All x / y / size values are fractions of the image (measured on the files),
 * so overlays drawn inside a <Cover> land exactly on the subject at any size.
 */
export type Pt = { x: number; y: number; s: number };

export const MEDIA = {
  hero: {
    src: "/images/hero-portrait.jpg",
    ratio: 1792 / 1008,
    alt: "A woman turning toward the camera in low tungsten light, locked by a yellow face-tracking square",
    face: { x: 0.662, y: 0.49, s: 0.2 } as Pt,
  },
  dancer: {
    src: "/images/reframe-dancer.jpg",
    ratio: 1792 / 1008,
    alt: "A dancer frozen mid-leap in a shaft of warm light inside a dark warehouse",
    subject: { x: 0.615, y: 0.43, s: 0.12 } as Pt,
  },
  skate: {
    src: "/images/track-skate.jpg",
    ratio: 1728 / 1152,
    alt: "A skateboarder mid-kickflip under a sodium street lamp at night, the board point-tracked",
    board: { x: 0.42, y: 0.6, s: 0.1 } as Pt,
  },
  rider: {
    src: "/images/night-rider.jpg",
    ratio: 1792 / 1008,
    alt: "A motorcyclist leaning into a wet mountain curve at night, followed by a virtual camera",
    rider: { x: 0.655, y: 0.5, s: 0.11 } as Pt,
  },
  husky: {
    src: "/images/husky.jpg",
    ratio: 1,
    alt: "A Siberian husky staring into the lens while pixel sunglasses lock onto its eyes",
    face: { x: 0.514, y: 0.52, s: 0.36 } as Pt,
    shades: { x: 0.5145, y: 0.46, w: 0.407 },
  },
  rig: {
    src: "/images/camera-rig.jpg",
    ratio: 1792 / 1008,
    alt: "A cinema camera on a tripod, rim-lit in a dark studio",
    lens: { x: 0.537, y: 0.445, s: 0.13 } as Pt,
  },
} as const;
