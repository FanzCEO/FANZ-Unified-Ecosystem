import { useQuery } from "@tanstack/react-query";

export function EarningsChart() {
  const { data: posts } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  // Mock chart data based on posts
  const chartData = [
    { month: "Jan", earnings: 0.6 },
    { month: "Feb", earnings: 0.8 },
    { month: "Mar", earnings: 1.2 },
    { month: "Apr", earnings: 1.8 },
    { month: "May", earnings: 1.0 },
    { month: "Jun", earnings: 1.6 },
  ];

  const maxEarnings = Math.max(...chartData.map(d => d.earnings));

  return (
    <div className="h-64 flex items-end justify-between space-x-2" data-testid="chart-earnings">
      {chartData.map((data, index) => {
        const height = (data.earnings / maxEarnings) * 180; // Max height 180px
        const isActive = index === chartData.length - 1;
        
        return (
          <div key={data.month} className="flex flex-col items-center">
            <div 
              className={`w-8 rounded-t transition-all duration-300 ${
                isActive 
                  ? 'bg-primary' 
                  : index === chartData.length - 2 
                    ? 'bg-secondary' 
                    : 'bg-primary/30'
              }`}
              style={{ height: `${height}px` }}
              data-testid={`chart-bar-${data.month}`}
            ></div>
            <span className={`text-xs mt-2 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {data.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}
