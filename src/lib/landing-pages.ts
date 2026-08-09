import type { RenovationType } from '@/components/budget-request/quick-budget-form';

/**
 * Landings dedicadas de la campaña de Google Ads.
 *
 * Una por grupo de anuncios, para que el titular de la página replique la keyword
 * del grupo. Van con `noindex` para no canibalizar el SEO de /services/.
 */
export type LandingSlug = 'reforma-integral' | 'reforma-bano' | 'reforma-cocina';

type LandingConfig = {
  /** Preselecciona el tipo en el formulario, para que el visitante no tenga que elegirlo. */
  renovationType: RenovationType;
  /** Clave de `budgetRequest.reformInclusions`: reutiliza el desglose ya traducido a 4 idiomas. */
  inclusionsKey: 'integral' | 'bathrooms' | 'kitchen';
  media: { type: 'image' | 'video'; src: string };
};

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o';

export const landingPages: Record<LandingSlug, LandingConfig> = {
  'reforma-integral': {
    renovationType: 'integral',
    inclusionsKey: 'integral',
    media: {
      type: 'image',
      src: `${STORAGE}/refcon%2Freformas-interiores.jpg?alt=media&token=4851e102-3289-442b-bc00-dc0356241b1e`,
    },
  },
  'reforma-bano': {
    renovationType: 'bathrooms',
    inclusionsKey: 'bathrooms',
    media: {
      type: 'video',
      src: `${STORAGE}/refcon%2Fvideo%2Ffreepik__dolly-shot-a-serene-bathroom-scene-transitions-fro__5956.mp4?alt=media&token=76a12f63-d80b-44e4-8831-5cb538a8391b`,
    },
  },
  'reforma-cocina': {
    renovationType: 'kitchen',
    inclusionsKey: 'kitchen',
    media: {
      type: 'video',
      src: `${STORAGE}/refcon%2Fvideo%2Ffreepik__dolly-shot-transition-from-a-cluttered-outdated-ki__5958.mp4?alt=media&token=8157e8bc-e7b3-4641-8368-0d4f6c05de80`,
    },
  },
};

export const landingSlugs = Object.keys(landingPages) as LandingSlug[];
