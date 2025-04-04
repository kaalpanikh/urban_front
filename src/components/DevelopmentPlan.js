import React from 'react';
import './DevelopmentPlan.css';

const DevelopmentPlan = ({ developmentPlan }) => {
    if (!developmentPlan || developmentPlan.error) {
        return (
            <div className="development-plan-container error">
                <h3>Development Plan</h3>
                <p>Unable to generate development plan. {developmentPlan?.error || ''}</p>
            </div>
        );
    }

    const {
        area_classification,
        development_goals,
        infrastructure_plan,
        sustainability_initiatives,
        zoning_recommendations,
        estimated_timeline,
        potential_challenges
    } = developmentPlan;

    return (
        <div className="development-plan-container">
            <h3>Urban Development Plan</h3>

            <div className="plan-section">
                <h4>Area Classification</h4>
                <p><strong>Type:</strong> {area_classification.primary_type.charAt(0).toUpperCase() + area_classification.primary_type.slice(1)}</p>
                <p>{area_classification.description}</p>
            </div>

            <div className="plan-section">
                <h4>Development Goals</h4>
                <ul>
                    {development_goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                    ))}
                </ul>
            </div>

            <div className="plan-section">
                <h4>Infrastructure Plan</h4>
                <div className="infra-subsection">
                    <h5>Transportation</h5>
                    <ul>
                        {infrastructure_plan.transportation.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="infra-subsection">
                    <h5>Utilities</h5>
                    <ul>
                        {infrastructure_plan.utilities.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="infra-subsection">
                    <h5>Public Facilities</h5>
                    <ul>
                        {infrastructure_plan.public_facilities.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="plan-section">
                <h4>Sustainability Initiatives</h4>
                <ul>
                    {sustainability_initiatives.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="plan-section">
                <h4>Zoning Recommendations</h4>
                <ul>
                    {zoning_recommendations.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="plan-section">
                <h4>Implementation Timeline</h4>
                <div className="timeline-container">
                    <div className="timeline-phase">
                        <h5>Short Term (1-2 years)</h5>
                        <ul>
                            {estimated_timeline.short_term.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="timeline-phase">
                        <h5>Medium Term (3-5 years)</h5>
                        <ul>
                            {estimated_timeline.medium_term.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="timeline-phase">
                        <h5>Long Term (5+ years)</h5>
                        <ul>
                            {estimated_timeline.long_term.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="plan-section">
                <h4>Potential Challenges</h4>
                <ul>
                    {potential_challenges.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DevelopmentPlan;
