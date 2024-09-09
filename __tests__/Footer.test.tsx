import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";
import styles from "@/components/Footer/footer.module.css";

describe("Footer", () => {
  describe("When skills are provided", () => {
    const skills = [
      { key: "1", name: "JavaScript" },
      { key: "2", name: "React" },
    ];
    const education = [{ key: "1", name: "Bachelor's Degree" }];

    it("renders skills section", () => {
      render(<Footer skills={skills} education={education} />);
      expect(screen.getByText("Skills")).toBeInTheDocument();
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("renders ATS skill with special class", () => {
      const atsSkills = [{ key: "ATS", name: "ATS Skill" }];
      render(<Footer skills={atsSkills} education={education} />);
      const atsSkill = screen.getByText("ATS Skill");
      expect(atsSkill).toHaveClass(styles.ast);
    });

    it("education section has correct class", () => {
      render(<Footer skills={skills} education={education} />);
      const educationSection = screen.getByText("Education").closest("div");
      expect(educationSection).toHaveClass(styles.education);
    });

    it("matches snapshot when skills and education are provided", () => {
      const { container } = render(
        <Footer skills={skills} education={education} />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe("When skills are not provided", () => {
    const education = [
      { key: "1", name: "Bachelor's Degree" },
      { key: "2", name: "Master's Degree" },
    ];

    it("does not render skills section", () => {
      render(<Footer education={education} />);
      expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    });

    it("renders education section correctly", () => {
      render(<Footer education={education} />);
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Bachelor's Degree")).toBeInTheDocument();
      expect(screen.getByText("Master's Degree")).toBeInTheDocument();
    });

    it("education section does not have special class", () => {
      render(<Footer education={education} />);
      const educationSection = screen.getByText("Education").closest("div");
      expect(educationSection).not.toHaveClass(styles.education);
    });

    it("matches snapshot when only education is provided", () => {
      const { container } = render(<Footer education={education} />);
      expect(container).toMatchSnapshot();
    });
  });
});
