import { motion } from "framer-motion";
import BeforeAfterSlider from "./BeforeAfterSlider";
import CardSectionWrapper from "./CardSectionWrapper";
import type { ResolvedCardTheme } from "@/lib/cardTokens";
import type { MetallicEffect } from "./CardThemeEditor";

export interface ProjectItem {
  title: string;
  beforeImage: string;
  afterImage: string;
  description?: string;
}

interface ProjectShowcaseProps {
  projects: ProjectItem[];
  theme: ResolvedCardTheme;
  metallicEffect?: MetallicEffect;
  /** Starting stagger index for section wrapper animation */
  baseIndex?: number;
}

/**
 * Renders a collection of before/after project comparison cards.
 * Each project is displayed inside a themed section wrapper with
 * the interactive slider, title, and optional description.
 */
export default function ProjectShowcase({
  projects,
  theme,
  metallicEffect,
  baseIndex = 10,
}: ProjectShowcaseProps) {
  const { palette, radii, fonts } = theme;

  if (!projects || projects.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {projects.map((project, i) => (
        <CardSectionWrapper
          key={i}
          theme={theme}
          index={baseIndex + i}
          metallicEffect={metallicEffect}
        >
          {/* Project title */}
          <motion.h4
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: palette.primary,
              margin: "0 0 10px",
              fontFamily: `'${fonts.primary}', sans-serif`,
            }}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {project.title}
          </motion.h4>

          {/* Slider */}
          <BeforeAfterSlider
            beforeSrc={project.beforeImage}
            afterSrc={project.afterImage}
            radius={radii.button}
            height={220}
            accentColor={palette.primary}
          />

          {/* Description */}
          {project.description && (
            <motion.p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: palette.secondary,
                margin: "10px 0 0",
                fontFamily: `'${fonts.secondary}', sans-serif`,
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {project.description}
            </motion.p>
          )}
        </CardSectionWrapper>
      ))}
    </div>
  );
}
