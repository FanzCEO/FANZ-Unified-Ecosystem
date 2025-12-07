"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TutorialsPage;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const useAuth_1 = require("@/hooks/useAuth");
const wouter_1 = require("wouter");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
function TutorialsPage() {
    const { user } = (0, useAuth_1.useAuth)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [difficultyFilter, setDifficultyFilter] = (0, react_1.useState)('all');
    const [roleFilter, setRoleFilter] = (0, react_1.useState)('all');
    // Fetch tutorials from API
    const { data: tutorialsData, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/tutorials', roleFilter, difficultyFilter],
        queryFn: () => {
            const params = new URLSearchParams();
            if (roleFilter !== 'all')
                params.set('role', roleFilter);
            if (difficultyFilter !== 'all')
                params.set('difficulty', difficultyFilter);
            const queryString = params.toString();
            const url = `/api/tutorials${queryString ? `?${queryString}` : ''}`;
            return fetch(url).then(res => res.json());
        }
    });
    const tutorials = (tutorialsData === null || tutorialsData === void 0 ? void 0 : tutorialsData.tutorials) || [];
    // Mock progress data - in production this would come from API
    const mockProgress = {
        '1': { completedSteps: 3, isCompleted: false },
        '2': { completedSteps: 0, isCompleted: false },
        '3': { completedSteps: 6, isCompleted: true },
        '4': { completedSteps: 0, isCompleted: false },
        '5': { completedSteps: 8, isCompleted: false }
    };
    const filteredTutorials = tutorials.filter(tutorial => {
        const matchesSearch = searchQuery === '' ||
            tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.summary.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === 'all' || tutorial.difficulty === difficultyFilter;
        const matchesRole = roleFilter === 'all' || tutorial.roleTarget === roleFilter || tutorial.roleTarget === 'all';
        return matchesSearch && matchesDifficulty && matchesRole;
    });
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-600';
            case 'intermediate':
                return 'bg-yellow-600';
            case 'advanced':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };
    const getRoleColor = (role) => {
        switch (role) {
            case 'creator':
                return 'text-pink-400 border-pink-600';
            case 'fan':
                return 'text-blue-400 border-blue-600';
            case 'admin':
                return 'text-purple-400 border-purple-600';
            case 'all':
                return 'text-cyan-400 border-cyan-600';
            default:
                return 'text-gray-400 border-gray-600';
        }
    };
    const getProgressPercentage = (tutorial) => {
        if (!tutorial.completedSteps)
            return 0;
        return Math.round((tutorial.completedSteps / tutorial.stepCount) * 100);
    };
    return (React.createElement("div", { className: "min-h-screen bg-black text-white" },
        React.createElement("div", { className: "fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat", style: {
                backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
            } }),
        React.createElement("div", { className: "relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" },
            React.createElement("div", { className: "text-center mb-6 sm:mb-8" },
                React.createElement("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent" }, "Tutorials & Learning"),
                React.createElement("p", { className: "text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4" }, "Step-by-step guides to master every aspect of the GirlFanz platform")),
            React.createElement("div", { className: "mb-8" },
                React.createElement("div", { className: "flex flex-col md:flex-row gap-4 mb-6" },
                    React.createElement("div", { className: "flex-1 relative" },
                        React.createElement(lucide_react_1.Search, { className: "absolute left-3 top-3 h-5 w-5 text-gray-400" }),
                        React.createElement(input_1.Input, { placeholder: "Search tutorials...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-12 bg-gray-900/50 border-gray-800 text-white", "data-testid": "input-tutorial-search" })),
                    React.createElement("div", { className: "flex flex-wrap gap-3 sm:gap-4" },
                        React.createElement(select_1.Select, { value: difficultyFilter, onValueChange: setDifficultyFilter },
                            React.createElement(select_1.SelectTrigger, { className: "w-full sm:w-40 bg-gray-900/50 border-gray-800 text-white" },
                                React.createElement(lucide_react_1.Filter, { className: "h-4 w-4 mr-2" }),
                                React.createElement(select_1.SelectValue, { placeholder: "Difficulty" })),
                            React.createElement(select_1.SelectContent, { className: "bg-gray-900 border-gray-800" },
                                React.createElement(select_1.SelectItem, { value: "all" }, "All Levels"),
                                React.createElement(select_1.SelectItem, { value: "beginner" }, "Beginner"),
                                React.createElement(select_1.SelectItem, { value: "intermediate" }, "Intermediate"),
                                React.createElement(select_1.SelectItem, { value: "advanced" }, "Advanced"))),
                        React.createElement(select_1.Select, { value: roleFilter, onValueChange: setRoleFilter },
                            React.createElement(select_1.SelectTrigger, { className: "w-full sm:w-32 bg-gray-900/50 border-gray-800 text-white" },
                                React.createElement(lucide_react_1.Users, { className: "h-4 w-4 mr-2" }),
                                React.createElement(select_1.SelectValue, { placeholder: "Role" })),
                            React.createElement(select_1.SelectContent, { className: "bg-gray-900 border-gray-800" },
                                React.createElement(select_1.SelectItem, { value: "all" }, "All Roles"),
                                React.createElement(select_1.SelectItem, { value: "fan" }, "Fan"),
                                React.createElement(select_1.SelectItem, { value: "creator" }, "Creator"),
                                React.createElement(select_1.SelectItem, { value: "admin" }, "Admin")))))),
            React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8" },
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                        React.createElement(lucide_react_1.GraduationCap, { className: "h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" }),
                        React.createElement("div", { className: "text-xl sm:text-2xl font-bold text-white" }, tutorials.length),
                        React.createElement("div", { className: "text-xs sm:text-sm text-gray-400" }, "Total Tutorials"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                        React.createElement(lucide_react_1.CheckCircle, { className: "h-8 w-8 text-blue-400 mx-auto mb-2" }),
                        React.createElement("div", { className: "text-2xl font-bold text-white" }, tutorials.filter(t => t.isCompleted).length),
                        React.createElement("div", { className: "text-sm text-gray-400" }, "Completed"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                        React.createElement(lucide_react_1.Play, { className: "h-8 w-8 text-yellow-400 mx-auto mb-2" }),
                        React.createElement("div", { className: "text-2xl font-bold text-white" }, tutorials.filter(t => (t.completedSteps || 0) > 0 && !t.isCompleted).length),
                        React.createElement("div", { className: "text-sm text-gray-400" }, "In Progress"))),
                React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                    React.createElement(card_1.CardContent, { className: "p-4 text-center" },
                        React.createElement(lucide_react_1.Clock, { className: "h-8 w-8 text-purple-400 mx-auto mb-2" }),
                        React.createElement("div", { className: "text-2xl font-bold text-white" },
                            Math.round(tutorials.reduce((acc, t) => acc + t.estimatedMinutes, 0) / tutorials.length),
                            "m"),
                        React.createElement("div", { className: "text-sm text-gray-400" }, "Avg Duration")))),
            isLoading ? (React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, [1, 2, 3, 4, 5, 6].map((i) => (React.createElement(card_1.Card, { key: i, className: "bg-gray-900/50 border-gray-800" },
                React.createElement(card_1.CardHeader, null,
                    React.createElement("div", { className: "animate-pulse space-y-3" },
                        React.createElement("div", { className: "h-4 bg-gray-700 rounded w-3/4" }),
                        React.createElement("div", { className: "h-3 bg-gray-700 rounded w-full" }),
                        React.createElement("div", { className: "h-8 bg-gray-700 rounded" })))))))) : filteredTutorials.length > 0 ? (React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredTutorials.map((tutorial) => {
                var _a;
                return (React.createElement(card_1.Card, { key: tutorial.id, className: "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group", onClick: () => setLocation(`/tutorials/${tutorial.id}`), "data-testid": `tutorial-${tutorial.id}` },
                    React.createElement(card_1.CardHeader, null,
                        React.createElement("div", { className: "flex items-start justify-between mb-2" },
                            React.createElement("div", { className: "flex items-center space-x-2" }, tutorial.isCompleted ? (React.createElement(lucide_react_1.CheckCircle, { className: "h-6 w-6 text-green-400" })) : tutorial.completedSteps && tutorial.completedSteps > 0 ? (React.createElement(lucide_react_1.Play, { className: "h-6 w-6 text-yellow-400" })) : (React.createElement(lucide_react_1.GraduationCap, { className: "h-6 w-6 text-gray-400" }))),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(badge_1.Badge, { className: getRoleColor(tutorial.roleTarget), variant: "outline" }, tutorial.roleTarget),
                                React.createElement(badge_1.Badge, { className: `${getDifficultyColor(tutorial.difficulty)} text-white` }, tutorial.difficulty))),
                        React.createElement(card_1.CardTitle, { className: "text-white group-hover:text-green-400 transition-colors" }, tutorial.title),
                        React.createElement(card_1.CardDescription, { className: "text-gray-400" }, tutorial.summary)),
                    React.createElement(card_1.CardContent, null,
                        tutorial.completedSteps !== undefined && tutorial.completedSteps > 0 && (React.createElement("div", { className: "mb-4" },
                            React.createElement("div", { className: "flex items-center justify-between text-sm text-gray-400 mb-2" },
                                React.createElement("span", null, "Progress"),
                                React.createElement("span", null,
                                    tutorial.completedSteps,
                                    "/",
                                    tutorial.stepCount,
                                    " steps")),
                            React.createElement(progress_1.Progress, { value: getProgressPercentage(tutorial), className: "h-2" }))),
                        React.createElement("div", { className: "flex items-center justify-between text-sm text-gray-500 mb-4" },
                            React.createElement("div", { className: "flex items-center space-x-4" },
                                React.createElement("div", { className: "flex items-center" },
                                    React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 mr-1" }),
                                    tutorial.estimatedMinutes,
                                    " min"),
                                React.createElement("div", { className: "flex items-center" },
                                    React.createElement(lucide_react_1.Users, { className: "h-4 w-4 mr-1" }),
                                    ((_a = tutorial.enrollments) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || '0'),
                                tutorial.rating && (React.createElement("div", { className: "flex items-center text-yellow-400" },
                                    React.createElement(lucide_react_1.Star, { className: "h-4 w-4 fill-current mr-1" }),
                                    tutorial.rating)))),
                        React.createElement(button_1.Button, { className: `w-full ${tutorial.isCompleted
                                ? 'bg-green-600 hover:bg-green-700'
                                : tutorial.completedSteps && tutorial.completedSteps > 0
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700'}`, "data-testid": `button-start-tutorial-${tutorial.id}` }, tutorial.isCompleted ? (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 mr-2" }),
                            "Review Tutorial")) : tutorial.completedSteps && tutorial.completedSteps > 0 ? (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.Play, { className: "h-4 w-4 mr-2" }),
                            "Continue Learning")) : (React.createElement(React.Fragment, null,
                            React.createElement(lucide_react_1.Play, { className: "h-4 w-4 mr-2" }),
                            "Start Tutorial"))))));
            }))) : (React.createElement(card_1.Card, { className: "bg-gray-900/50 border-gray-800" },
                React.createElement(card_1.CardContent, { className: "text-center py-12" },
                    React.createElement(lucide_react_1.Search, { className: "h-12 w-12 text-gray-500 mx-auto mb-4" }),
                    React.createElement("h3", { className: "text-lg font-semibold text-white mb-2" }, "No tutorials found"),
                    React.createElement("p", { className: "text-gray-400 mb-4" }, searchQuery ?
                        `No tutorials match your search criteria.` :
                        'No tutorials available for the selected filters.'),
                    React.createElement(button_1.Button, { onClick: () => {
                            setSearchQuery('');
                            setDifficultyFilter('all');
                            setRoleFilter('all');
                        }, variant: "outline", className: "border-gray-600 text-gray-300 hover:bg-gray-800" }, "Clear Filters")))),
            React.createElement(card_1.Card, { className: "mt-8 bg-gradient-to-r from-green-900/20 to-cyan-900/20 border-green-800/50" },
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-white flex items-center" },
                        React.createElement(lucide_react_1.GraduationCap, { className: "h-6 w-6 mr-2 text-cyan-400" }),
                        "Recommended for You"),
                    React.createElement(card_1.CardDescription, { className: "text-gray-300" }, "Based on your role and current progress, we suggest starting with these tutorials.")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "flex flex-wrap gap-2" }, tutorials.filter(t => t.difficulty === 'beginner').slice(0, 3).map((tutorial) => (React.createElement(badge_1.Badge, { key: tutorial.id, variant: "outline", className: "text-green-400 border-green-600 cursor-pointer hover:bg-green-600 hover:text-white transition-colors" }, tutorial.title)))))))));
}
