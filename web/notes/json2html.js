const buildMenu = (nodes) =>
`${nodes.map(
    ({ id, name, link, sub }) =>
    sub
    ? `<li>${name || id}${buildMenu(sub)}</li>`
    : `<li>${id || name || link}</li>`
).join('')}`;

// Example usage:
const jsonData = {
    name: "Tree",
    id: "999999",
    is_open: true,
    children: [
        {
            name: "Tree Step 1",
            id: "1",
            is_open: true,
            children: [
                { name: "Tree Step 1.1", id: "1" },
                { name: "Tree Step 1.2", id: "2" }
            ]
        },
        {
            name: "Tree Step 2",
            id: "3",
            is_open: true,
            children: [
                { name: "Tree Step 2.1", id: "5" },
                { name: "Tree Step 2.2", id: "4" }
            ]
        }
    ]
};

const htmlTree = `<ul>${buildMenu(jsonData.children)}</ul>`;
document.getElementById("output").innerHTML = htmlTree;
