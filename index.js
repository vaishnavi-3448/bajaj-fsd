const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({
    origin: "*"
}));



app.use(cors());
app.use(express.json());

function isValidEdge(str) {
    if (!str) return false;

    str = str.trim();

    const regex = /^[A-Z]->[A-Z]$/;
    if (!regex.test(str)) return false;

    const [parent, child] = str.split("->");

    if (parent === child) return false;

    return true;
}

function buildTree(node, graph, visited, stack) {
    if (stack.has(node)) {
        return { cycle: true, nodes: new Set(stack) };
    }

    stack.add(node);

    let subtree = {};
    let maxDepth = 1;

    if (graph[node]) {
        for (let child of graph[node]) {
            let res = buildTree(child, graph, visited, stack);

            if (res.cycle) return res;

            subtree[child] = res.tree;
            maxDepth = Math.max(maxDepth, 1 + res.depth);
        }
    }

    stack.delete(node);
    visited.add(node);

    return {
        tree: subtree,
        depth: maxDepth,
        nodes: visited
    };
}

app.post("/bfhl", (req, res) => {
    const data = req.body.data || [];

    const invalid_entries = [];
    const duplicate_edges = [];
    const seenEdges = new Set();

    let edges = [];

    data.forEach((item) => {
        if (!isValidEdge(item)) {
            invalid_entries.push(item);
            return;
        }

        item = item.trim();

        if (seenEdges.has(item)) {
            if (!duplicate_edges.includes(item)) {
                duplicate_edges.push(item);
            }
            return;
        }

        seenEdges.add(item);
        edges.push(item);
    });

    let graph = {};
    let childSet = new Set();

    edges.forEach(edge => {
        let [parent, child] = edge.split("->");

        if (!graph[parent]) graph[parent] = [];
        graph[parent].push(child);

        childSet.add(child);
    });

    let nodes = new Set();
    edges.forEach(e => {
        let [p, c] = e.split("->");
        nodes.add(p);
        nodes.add(c);
    });

    let roots = [...nodes].filter(n => !childSet.has(n));

    if (roots.length === 0 && nodes.size > 0) {
        roots = [[...nodes].sort()[0]];
    }

    let hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;

    let largest_depth = 0;
    let largest_tree_root = "";

    let processed = new Set();

    roots.forEach(root => {
        let visited = new Set();
        let stack = new Set();

        let res = buildTree(root, graph, visited, stack);

        res.nodes?.forEach(n => processed.add(n));

        if (res.cycle) {
            total_cycles++;

            let cycleNodes = [...res.nodes];
            let smallest = cycleNodes.sort()[0];

            hierarchies.push({
                root: smallest,
                tree: {},
                has_cycle: true
            });
        } else {
            total_trees++;

            if (
                res.depth > largest_depth ||
                (res.depth === largest_depth && root < largest_tree_root)
            ) {
                largest_depth = res.depth;
                largest_tree_root = root;
            }

            hierarchies.push({
                root,
                tree: { [root]: res.tree },
                depth: res.depth
            });
        }
    });

    nodes.forEach(node => {
        if (processed.has(node)) return;

        let visited = new Set();
        let stack = new Set();

        let res = buildTree(node, graph, visited, stack);

        res.nodes?.forEach(n => processed.add(n));

        if (res.cycle) {
            total_cycles++;

            let cycleNodes = [...res.nodes];
            let smallest = cycleNodes.sort()[0];

            hierarchies.push({
                root: smallest,
                tree: {},
                has_cycle: true
            });
        }
    });

    res.json({
        user_id: "vaishnavig_24112005",
        email_id: "vg3448@srmist.edu.in",
        college_roll_number: "RA2311003011504",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});